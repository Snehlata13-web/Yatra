import { useEffect, useMemo, useRef, useState } from 'react';
import { Megaphone, PlusCircle, Send, ImagePlus, X, CalendarDays, Film, Paperclip, ChevronRight, PencilLine, Trash2, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useResource, useAction } from '../../hooks/useResource';
import { noticeApi } from '../../api/services';
import { API_CONFIG } from '../../config/api.config';
import { PageHeader, Button, Drawer, TextField, TextArea, Notice, CardSkeleton, ErrorState, EmptyState, SearchField, ConfirmModal } from '../../components/ui';
import { formatDate, formatDateTime } from '../../utils/format';
import { validate, required, maxLen } from '../../utils/validate';

const LIMITS = API_CONFIG.NOTICE_MEDIA;
const isVideo = (type) => String(type).startsWith('video/');

function MediaGrid({ media, compact }) {
  if (!media?.length) return null;
  return (
    <div className={`notice-media ${compact ? 'notice-media--compact' : ''} notice-media--${Math.min(media.length, 4)}`}>
      {media.slice(0, compact ? 4 : media.length).map((m, i) => (
        isVideo(m.type) ? (
          <video key={i} src={m.url} controls={!compact} muted={compact} playsInline preload="metadata" />
        ) : (
          <img key={i} src={m.url} alt="" loading="lazy" />
        )
      ))}
      {compact && media.length > 4 && <span className="notice-media__more">+{media.length - 4}</span>}
    </div>
  );
}

function ComposeNotice({ notice, onDone, onCancel }) {
  const toast = useToast();
  const editing = Boolean(notice);
  const [values, setValues] = useState({ title: notice?.title || '', body: notice?.body || '' });
  const [kept, setKept] = useState(notice?.media || []);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const addFiles = (list) => {
    const incoming = [...list];
    const problems = [];
    const ok = incoming.filter((f) => {
      if (!LIMITS.TYPES.includes(f.type)) { problems.push(`${f.name}: unsupported type`); return false; }
      const max = (isVideo(f.type) ? LIMITS.MAX_VIDEO_MB : LIMITS.MAX_IMAGE_MB) * 1024 * 1024;
      if (f.size > max) { problems.push(`${f.name}: larger than ${isVideo(f.type) ? LIMITS.MAX_VIDEO_MB : LIMITS.MAX_IMAGE_MB} MB`); return false; }
      return true;
    });
    const room = LIMITS.MAX_FILES - kept.length;
    const next = [...files, ...ok].slice(0, Math.max(room, 0));
    if (files.length + ok.length > room) problems.push(`Only ${LIMITS.MAX_FILES} attachments are allowed`);
    setFiles(next);
    setErrors((e) => ({ ...e, files: problems.join(' · ') || undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(values, {
      title: [required('Title'), maxLen(200, 'Title')],
      body: [required('Notice text'), maxLen(10000, 'Notice text')],
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setServerError('');
    try {
      const payload = { title: values.title.trim(), body: values.body.trim(), files };
      if (editing) {
        await noticeApi.update(notice.id, { ...payload, keep: kept }, setProgress);
        toast.success('Notice updated');
      } else {
        await noticeApi.create(payload, setProgress);
        toast.success('Notice published', 'Students can see it now.');
      }
      onDone();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      {serverError && <Notice tone="error" title={editing ? 'Couldn’t save changes' : 'Couldn’t publish notice'}>{serverError}</Notice>}
      <TextField label="Title" placeholder="e.g. Water supply maintenance on Sunday" value={values.title} onChange={(e) => { setValues((v) => ({ ...v, title: e.target.value })); setErrors((x) => ({ ...x, title: undefined })); }} error={errors.title} maxLength={200} required />
      <TextArea label="Notice" rows={7} placeholder="Write the full announcement for hostel residents…" value={values.body} onChange={(e) => { setValues((v) => ({ ...v, body: e.target.value })); setErrors((x) => ({ ...x, body: undefined })); }} error={errors.body} maxLength={10000} required />

      <div className="field">
        <span className="field__label">Attachments <span className="field__opt">(optional · up to {LIMITS.MAX_FILES})</span></span>
        <button
          type="button"
          className="dropzone"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          disabled={kept.length + files.length >= LIMITS.MAX_FILES || loading}
        >
          <ImagePlus size={22} aria-hidden />
          <strong>Add photos or videos</strong>
          <small>Images up to {LIMITS.MAX_IMAGE_MB} MB · videos up to {LIMITS.MAX_VIDEO_MB} MB</small>
        </button>
        <input ref={inputRef} type="file" multiple accept={LIMITS.TYPES.join(',')} className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        {errors.files && <p className="field__error" role="alert">{errors.files}</p>}
        {(kept.length > 0 || previews.length > 0) && (
          <ul className="upload-list">
            {kept.map((m) => (
              <li key={m.path || m.url}>
                {isVideo(m.type) ? <span className="upload-list__thumb"><Film size={18} aria-hidden /></span> : <img className="upload-list__thumb" src={m.url} alt="" />}
                <span className="upload-list__name">{isVideo(m.type) ? 'Video' : 'Photo'}<small>Already attached</small></span>
                <button type="button" className="icon-btn" aria-label="Remove attachment" onClick={() => setKept((k) => k.filter((x) => x !== m))} disabled={loading}><X size={16} /></button>
              </li>
            ))}
            {previews.map((p, i) => (
              <li key={p.url}>
                {isVideo(p.file.type) ? <span className="upload-list__thumb"><Film size={18} aria-hidden /></span> : <img className="upload-list__thumb" src={p.url} alt="" />}
                <span className="upload-list__name">{p.file.name}<small>{(p.file.size / (1024 * 1024)).toFixed(1)} MB</small></span>
                <button type="button" className="icon-btn" aria-label={`Remove ${p.file.name}`} onClick={() => setFiles((f) => f.filter((_, j) => j !== i))} disabled={loading}><X size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {progress && <Notice tone="info">Uploading {progress.index + 1} of {progress.total}: {progress.name}</Notice>}

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" icon={editing ? Save : Send} loading={loading}>
          {loading ? (editing ? 'Saving' : 'Publishing') : (editing ? 'Save changes' : 'Publish notice')}
        </Button>
      </div>
    </form>
  );
}

export default function Notices() {
  const { user } = useAuth();
  const isWarden = user.role === 'warden';
  const res = useResource(noticeApi.list);
  const toast = useToast();
  const [compose, setCompose] = useState(false);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const del = useAction((n) => noticeApi.remove(n.id));
  const confirmDelete = async () => {
    try {
      await del.run(deleting);
      toast.success('Notice deleted');
      setDeleting(null);
      setOpen(null);
      res.refresh();
    } catch { /* inline */ }
  };
  const [q, setQ] = useState('');
  const all = res.data || [];
  const rows = all.filter((n) => !q.trim() || `${n.title} ${n.body}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="stack-xl">
      <PageHeader
        icon={Megaphone}
        eyebrow="Hostel announcements"
        title="Notices"
        description={isWarden ? 'Publish announcements, with photos or videos, for every hostel resident.' : 'Latest announcements from your hostel warden.'}
        onRefresh={res.refresh}
        refreshing={res.refreshing}
        actions={isWarden && <Button icon={PlusCircle} onClick={() => setCompose(true)}>New notice</Button>}
      />

      {all.length > 0 && <SearchField value={q} onChange={setQ} placeholder="Search notices" label="Search notices" className="search--wide" />}

      {res.loading ? (
        <CardSkeleton count={4} />
      ) : res.error?.status === 503 ? (
        <EmptyState
          art="helpdesk"
          title="Notices aren’t set up on the server yet"
          message={isWarden
            ? 'The backend needs its storage key (SUPABASE_SERVICE_ROLE_KEY) and the “warden-notices” bucket before notices can be published or shown.'
            : 'Hostel announcements will appear here once the office enables them.'}
        />
      ) : res.error ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : all.length === 0 ? (
        <EmptyState
          art="helpdesk"
          title="No notices yet"
          message={isWarden ? 'Publish the first announcement for your hostel.' : 'Announcements from the warden will appear here.'}
          action={isWarden && <Button icon={PlusCircle} onClick={() => setCompose(true)}>New notice</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState art="search" title="No matching notices" compact />
      ) : (
        <div className="notice-feed">
          {rows.map((n, i) => (
            <button key={n.id} type="button" className={`notice-card ${i === 0 && !q ? 'is-latest' : ''}`} onClick={() => setOpen(n)}>
              <div className="notice-card__text">
                <span className="notice-card__meta">
                  {i === 0 && !q && <span className="notice-card__new">Latest</span>}
                  <CalendarDays size={13} aria-hidden /> {formatDate(n.createdAt)}
                  {n.media.length > 0 && <><Paperclip size={13} aria-hidden /> {n.media.length}</>}
                </span>
                <h3>{n.title}</h3>
                <p>{n.body}</p>
                <span className="notice-card__more">Read notice <ChevronRight size={15} aria-hidden /></span>
              </div>
              <MediaGrid media={n.media} compact />
            </button>
          ))}
        </div>
      )}

      <Drawer open={compose} onClose={() => setCompose(false)} title="New notice" subtitle="Announcement" width={600}>
        <ComposeNotice onCancel={() => setCompose(false)} onDone={() => { setCompose(false); res.refresh(); }} />
      </Drawer>

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit notice" subtitle="Announcement" width={600}>
        {editing && <ComposeNotice key={editing.id} notice={editing} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); setOpen(null); res.refresh(); }} />}
      </Drawer>

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => { setDeleting(null); del.clearError(); }}
        onConfirm={confirmDelete}
        loading={del.pending}
        error={del.error}
        tone="danger"
        title="Delete this notice?"
        confirmLabel="Delete notice"
        message={deleting ? `“${deleting.title}” and its attachments will be removed for everyone. This cannot be undone.` : ''}
      />

      <Drawer
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open?.title || 'Notice'}
        subtitle={open && `${formatDateTime(open.createdAt)}${open.updatedAt && open.updatedAt !== open.createdAt ? ' · edited' : ''}`}
        width={640}
        footer={isWarden && open && (
          <>
            <Button variant="danger-soft" icon={Trash2} onClick={() => setDeleting(open)}>Delete</Button>
            <Button variant="secondary" icon={PencilLine} onClick={() => setEditing(open)}>Edit notice</Button>
          </>
        )}
      >
        {open && (
          <article className="notice-detail">
            <p className="prose">{open.body}</p>
            <MediaGrid media={open.media} />
            {open.media.length > 0 && <p className="fine-print">Attachment links are private and expire after an hour — refresh to view later.</p>}
          </article>
        )}
      </Drawer>
    </div>
  );
}
