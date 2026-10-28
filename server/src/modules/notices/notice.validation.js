const path = require('node:path');

const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
]);
const extensionByMimeType = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
    ['image/gif', '.gif'],
    ['video/mp4', '.mp4'],
    ['video/webm', '.webm'],
    ['video/quicktime', '.mov']
]);
const matchesMimeExtension = (mimeType, extension) =>
    extension === extensionByMimeType.get(mimeType) ||
    (mimeType === 'image/jpeg' && extension === '.jpeg');
const maxImageBytes = 10 * 1024 * 1024;
const maxVideoBytes = 50 * 1024 * 1024;
const maxAttachments = 5;

const badRequest = (res, message) => res.status(400).json({ success: false, message });

const validateUpload = (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some((field) => !['file_name', 'content_type', 'file_size'].includes(field))) {
        return badRequest(res, 'Upload details must include a file name, content type, and file size');
    }
    if (typeof body.file_name !== 'string' || body.file_name.trim().length === 0 ||
        body.file_name.trim().length > 255) {
        return badRequest(res, 'File name must be between 1 and 255 characters');
    }
    if (typeof body.content_type !== 'string' || !allowedMimeTypes.has(body.content_type)) {
        return badRequest(res, 'Only supported image and video types can be uploaded');
    }
    const extension = path.extname(body.file_name.trim()).toLowerCase();
    if (!matchesMimeExtension(body.content_type, extension)) {
        return badRequest(res, 'File extension must match the declared content type');
    }
    const isImage = body.content_type.startsWith('image/');
    const maxBytes = isImage ? maxImageBytes : maxVideoBytes;
    if (!Number.isSafeInteger(body.file_size) || body.file_size < 1 || body.file_size > maxBytes) {
        return badRequest(res, `File size must be between 1 byte and ${Math.floor(maxBytes / (1024 * 1024))} MB`);
    }
    req.body = {
        file_name: body.file_name.trim(),
        content_type: body.content_type,
        file_size: body.file_size
    };
    next();
};

const validateCreate = (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return badRequest(res, 'Request body must be an object');
    }
    const unknown = Object.keys(body).filter((field) => !['title', 'body', 'media'].includes(field));
    if (unknown.length) {
        return badRequest(res, `Unsupported field(s): ${unknown.join(', ')}`);
    }
    if (typeof body.title !== 'string' ||
        body.title.trim().length < 1 ||
        body.title.trim().length > 200) {
        return badRequest(res, 'Title must be between 1 and 200 characters');
    }
    if (typeof body.body !== 'string' ||
        body.body.trim().length < 1 ||
        body.body.trim().length > 10000) {
        return badRequest(res, 'Notice text must be between 1 and 10000 characters');
    }
    const media = body.media === undefined ? [] : body.media;
    if (!Array.isArray(media) || media.length > maxAttachments) {
        return badRequest(res, `A notice can have at most ${maxAttachments} media attachments`);
    }
    for (const attachment of media) {
        if (!attachment || typeof attachment !== 'object' || Array.isArray(attachment) ||
            Object.keys(attachment).some((field) => !['path', 'content_type'].includes(field)) ||
            typeof attachment.path !== 'string' || attachment.path.trim() === '' ||
            typeof attachment.content_type !== 'string' || !allowedMimeTypes.has(attachment.content_type)) {
            return badRequest(res, 'Each attachment must have a valid storage path and supported content type');
        }
    }
    const paths = media.map((attachment) => attachment.path.trim());
    if (new Set(paths).size !== paths.length) {
        return badRequest(res, 'Duplicate media attachments are not allowed');
    }
    req.body = {
        title: body.title.trim(),
        body: body.body.trim(),
        media: media.map((attachment, index) => ({
            path: paths[index],
            content_type: attachment.content_type
        }))
    };
    next();
};

const validateNoticeId = (req, res, next) => {
    if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) {
        return badRequest(res, 'Notice id must be a positive integer');
    }
    next();
};

module.exports = {
    allowedMimeTypes,
    extensionByMimeType,
    matchesMimeExtension,
    maxAttachments,
    validateUpload,
    validateCreate,
    validateNoticeId
};
