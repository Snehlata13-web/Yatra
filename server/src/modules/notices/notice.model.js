const { randomUUID } = require('node:crypto');
const path = require('node:path');
const { getServiceSupabase } = require('../../config/db.js');
const { extensionByMimeType, matchesMimeExtension } = require('./notice.validation.js');

const bucketName = 'warden-notices';
const selectFields = 'id, warden_user_id, title, body, media, created_at, updated_at';
const signedUrlLifetimeSeconds = 60 * 60;
const maxImageBytes = 10 * 1024 * 1024;
const maxVideoBytes = 50 * 1024 * 1024;

const getFileExtension = (fileName) => {
    const extension = path.extname(fileName).toLowerCase();
    const allowedExtensions = new Set([...extensionByMimeType.values(), '.jpeg']);
    return allowedExtensions.has(extension) ? extension : '';
};

const createUploadUrl = async (wardenUserId, { file_name: fileName, content_type: contentType }) => {
    const extension = getFileExtension(fileName);
    if (!extension || !matchesMimeExtension(contentType, extension)) {
        const error = new Error('Unsupported file extension');
        error.statusCode = 400;
        throw error;
    }

    const objectPath = `${wardenUserId}/${randomUUID()}${extension}`;
    const { data, error } = await getServiceSupabase()
        .storage
        .from(bucketName)
        .createSignedUploadUrl(objectPath, { upsert: false });

    if (error) throw error;
    return {
        bucket: bucketName,
        path: objectPath,
        token: data.token,
        upload_url: data.signedUrl,
        content_type: contentType
    };
};

const signMedia = async (media) => Promise.all((media || []).map(async (item) => {
    const { data, error } = await getServiceSupabase()
        .storage
        .from(bucketName)
        .createSignedUrl(item.path, signedUrlLifetimeSeconds);
    if (error) throw error;
    return {
        url: data.signedUrl,
        path: item.path,
        content_type: item.content_type
    };
}));

// Checks that every new attachment was uploaded by this warden to the bucket.
// Paths already stored on the notice (when editing) are trusted and skipped.
const verifyAttachments = async (client, wardenUserId, media, alreadyAttached = new Set()) => {
    for (const attachment of media) {
        if (alreadyAttached.has(attachment.path)) continue;
        const pathParts = attachment.path.split('/');
        if (pathParts.length !== 2 || pathParts[0] !== String(wardenUserId)) {
            const error = new Error('Media attachment was not uploaded by this warden');
            error.statusCode = 400;
            throw error;
        }
        const [directory, fileName] = pathParts;
        if (!fileName || !/^[0-9a-f-]{36}\.[a-z0-9]+$/i.test(fileName) ||
            !matchesMimeExtension(attachment.content_type, path.extname(fileName).toLowerCase())) {
            const invalidPathError = new Error('Media attachment path or content type is invalid');
            invalidPathError.statusCode = 400;
            throw invalidPathError;
        }
        const { data: uploadedFiles, error: listError } = await client
            .storage
            .from(bucketName)
            .list(directory, { search: fileName });
        if (listError) throw listError;
        const uploadedFile = (uploadedFiles || []).find((file) => file.name === fileName);
        const actualSize = Number(uploadedFile && uploadedFile.metadata && uploadedFile.metadata.size);
        const actualContentType = uploadedFile && uploadedFile.metadata && uploadedFile.metadata.mimetype;
        const maxBytes = attachment.content_type.startsWith('image/') ? maxImageBytes : maxVideoBytes;
        if (!uploadedFile || !Number.isSafeInteger(actualSize) || actualSize < 1 ||
            actualSize > maxBytes || actualContentType !== attachment.content_type) {
            const invalidUploadError = new Error('An attached media upload is missing, oversized, or has an invalid type');
            invalidUploadError.statusCode = 400;
            throw invalidUploadError;
        }
    }
};

// Best-effort cleanup of files no longer referenced by any notice.
const removeFiles = async (client, paths) => {
    if (!paths.length) return;
    const { error } = await client.storage.from(bucketName).remove(paths);
    if (error) console.warn('Notice media cleanup failed:', error.message);
};

const findNoticeOrThrow = async (client, id) => {
    const { data, error } = await client
        .from('notices')
        .select(selectFields)
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    if (!data) {
        const notFound = new Error('Notice not found');
        notFound.statusCode = 404;
        throw notFound;
    }
    return data;
};

const updateNotice = async (id, wardenUserId, noticeData) => {
    const client = getServiceSupabase();
    const existing = await findNoticeOrThrow(client, id);
    const existingPaths = new Set((existing.media || []).map((item) => item.path));
    await verifyAttachments(client, wardenUserId, noticeData.media, existingPaths);

    const { data, error } = await client
        .from('notices')
        .update({
            title: noticeData.title,
            body: noticeData.body,
            media: noticeData.media,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(selectFields)
        .single();
    if (error) throw error;

    const keptPaths = new Set(noticeData.media.map((item) => item.path));
    await removeFiles(client, [...existingPaths].filter((p) => !keptPaths.has(p)));
    return { ...data, media: await signMedia(data.media) };
};

const deleteNotice = async (id) => {
    const client = getServiceSupabase();
    const existing = await findNoticeOrThrow(client, id);
    const { error } = await client.from('notices').delete().eq('id', id);
    if (error) throw error;
    await removeFiles(client, (existing.media || []).map((item) => item.path));
    return { id: existing.id };
};

const createNotice = async (wardenUserId, noticeData) => {
    const client = getServiceSupabase();
    for (const attachment of noticeData.media) {
        const pathParts = attachment.path.split('/');
        if (pathParts.length !== 2 || pathParts[0] !== String(wardenUserId)) {
            const error = new Error('Media attachment was not uploaded by this warden');
            error.statusCode = 400;
            throw error;
        }
        const [directory, fileName] = pathParts;
        if (directory !== String(wardenUserId) || !fileName ||
            !/^[0-9a-f-]{36}\.[a-z0-9]+$/i.test(fileName) ||
            !matchesMimeExtension(attachment.content_type, path.extname(fileName).toLowerCase())) {
            const invalidPathError = new Error('Media attachment path or content type is invalid');
            invalidPathError.statusCode = 400;
            throw invalidPathError;
        }
        const { data: uploadedFiles, error: listError } = await client
            .storage
            .from(bucketName)
            .list(directory, { search: fileName });
        if (listError) throw listError;
        const uploadedFile = (uploadedFiles || []).find((file) => file.name === fileName);
        const actualSize = Number(uploadedFile && uploadedFile.metadata && uploadedFile.metadata.size);
        const actualContentType = uploadedFile && uploadedFile.metadata && uploadedFile.metadata.mimetype;
        const maxBytes = attachment.content_type.startsWith('image/') ? maxImageBytes : maxVideoBytes;
        if (!uploadedFile || !Number.isSafeInteger(actualSize) || actualSize < 1 ||
            actualSize > maxBytes || actualContentType !== attachment.content_type) {
            const invalidUploadError = new Error('An attached media upload is missing, oversized, or has an invalid type');
            invalidUploadError.statusCode = 400;
            throw invalidUploadError;
        }
    }

    const signedMedia = await signMedia(noticeData.media);
    const { data, error } = await client
        .from('notices')
        .insert({
            warden_user_id: wardenUserId,
            title: noticeData.title,
            body: noticeData.body,
            media: noticeData.media
        })
        .select(selectFields)
        .single();
    if (error) throw error;
    return { ...data, media: signedMedia };
};

const getNotices = async () => {
    const { data, error } = await getServiceSupabase()
        .from('notices')
        .select(selectFields)
        .order('created_at', { ascending: false })
        .limit(50);
    if (error) throw error;
    return Promise.all(data.map(async (notice) => ({
        ...notice,
        media: await signMedia(notice.media)
    })));
};

const getNoticeById = async (id) => {
    const { data, error } = await getServiceSupabase()
        .from('notices')
        .select(selectFields)
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, media: await signMedia(data.media) };
};

module.exports = {
    createUploadUrl,
    createNotice,
    getNotices,
    getNoticeById,
    updateNotice,
    deleteNotice
};
