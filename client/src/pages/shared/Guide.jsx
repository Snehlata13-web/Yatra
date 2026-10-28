import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Workflow, Map, Palette, PlusCircle, Search, LogIn } from 'lucide-react';
import { Logo } from '../../components/layout/Logo';
import { NAVIGATION, ROLE_LABEL } from '../../config/app.config';
import { API_CONFIG } from '../../config/api.config';
import {
  Tabs, Button, StatusBadge, TextField, PasswordField, TextArea, SelectField, SearchField, StatCard, EmptyState, ErrorState, Notice, Skeleton, Spinner, ConfirmModal, Card,
} from '../../components/ui';
import { useToast } from '../../context/ToastContext';

const FLOWS = [
  {
    title: 'Pass journey',
    steps: [
      { role: 'student', text: 'Student submits a pass', to: '/student/passes/new' },
      { role: 'warden', text: 'Warden approves it', to: '/warden/passes' },
      { role: 'guard', text: 'Guard verifies the pass', to: '/guard' },
      { role: 'guard', text: 'Guard marks OUT', to: '/guard' },
      { role: 'guard', text: 'Guard marks IN', to: '/guard/verified' },
    ],
  },
  {
    title: 'Complaint resolution',
    steps: [
      { role: 'student', text: 'Student submits a complaint', to: '/student/complaints' },
      { role: 'warden', text: 'Warden starts work (In Progress)', to: '/warden/complaints' },
      { role: 'warden', text: 'Warden marks work done (Awaiting Confirmation)', to: '/warden/complaints' },
      { role: 'student', text: 'Student confirms solved — or reopens', to: '/student/complaints' },
    ],
  },
  {
    title: 'Student onboarding',
    steps: [
      { role: 'guest', text: 'Student registers with academic & room details', to: '/register' },
      { role: 'guest', text: 'Sees pending-approval screen', to: '/pending-approval' },
      { role: 'warden', text: 'Warden approves the registration', to: '/warden/students' },
      { role: 'student', text: 'Student signs in', to: '/login' },
    ],
  },
  {
    title: 'Staff onboarding',
    steps: [
      { role: 'guest', text: 'Warden/Guard registers', to: '/register' },
      { role: 'guest', text: 'Sees pending-approval screen', to: '/pending-approval' },
      { role: 'admin', text: 'Admin approves the account', to: '/admin' },
      { role: 'guest', text: 'Staff signs in', to: '/login' },
    ],
  },
];

const TOKENS = [
  ['--brown-950', 'Maroon night'], ['--brown-800', 'Heritage brown'], ['--copper-500', 'Copper (primary)'], ['--gold-400', 'GL gold'],
  ['--cream-50', 'Cream'], ['--cream-100', 'Parchment'], ['--sage-500', 'Sage (success)'], ['--red-500', 'Muted red'],
];

export default function Guide() {
  const [tab, setTab] = useState('flows');
  const [modal, setModal] = useState(false);
  const [q, setQ] = useState('');
  const toast = useToast();

  return (
    <div className="guide">
      <header className="guide__bar">
        <Logo />
        <Link to="/login" className="btn btn--glass btn--sm"><LogIn size={16} aria-hidden /> <span>Sign in</span></Link>
      </header>
      <div className="guide__inner">
        <div className="page-head">
          <div className="page-head__text">
            <p className="eyebrow">Prototype guide</p>
            <h1 className="page-head__title">Yatra sitemap, workflows & design system</h1>
            <p className="page-head__desc">Sign in as each role to walk through a workflow end-to-end.</p>
          </div>
        </div>

        <Tabs value={tab} onChange={setTab} label="Guide sections" items={[
          { value: 'flows', label: 'Workflows', icon: Workflow },
          { value: 'map', label: 'Sitemap', icon: Map },
          { value: 'ui', label: 'Components & tokens', icon: Palette },
        ]} />

        {tab === 'flows' && (
          <div className="stack-lg mt-24">
            <Card>
              <h3 className="card-title">Connected backend</h3>
              <p className="muted">API base URL: <code>{API_CONFIG.BASE_URL}</code> — change it in <code>src/config/api.config.js</code>.</p>
            </Card>
            {FLOWS.map((f) => (
              <Card key={f.title}>
                <h3 className="card-title">{f.title}</h3>
                <ol className="flow">
                  {f.steps.map((s, i) => (
                    <li key={i} className="flow__step">
                      <span className="flow__num">{i + 1}</span>
                      <span className={`role-tag role-tag--${s.role}`}>{s.role === 'guest' ? 'Visitor' : ROLE_LABEL[s.role]}</span>
                      <span className="flow__text">{s.text}</span>
                      <Link to={s.to} className="link-btn">Open <ArrowRight size={14} aria-hidden /></Link>
                    </li>
                  ))}
                </ol>
              </Card>
            ))}
          </div>
        )}

        {tab === 'map' && (
          <div className="sitemap mt-24">
            <Card>
              <h3 className="card-title">Public</h3>
              <ul className="sitemap__list">
                <li><Link to="/login">/login</Link> Sign in</li>
                <li><Link to="/register">/register</Link> Create account (Student, Warden, Guard)</li>
                <li><Link to="/pending-approval">/pending-approval</Link> Account pending</li>
                <li><Link to="/guide">/guide</Link> This guide</li>
              </ul>
            </Card>
            {Object.entries(NAVIGATION).map(([role, items]) => (
              <Card key={role}>
                <h3 className="card-title"><span className={`role-tag role-tag--${role}`}>{ROLE_LABEL[role]}</span></h3>
                <ul className="sitemap__list">
                  {items.map((i) => <li key={i.to}><Link to={i.to}>{i.to}</Link> {i.label}</li>)}
                </ul>
              </Card>
            ))}
          </div>
        )}

        {tab === 'ui' && (
          <div className="stack-lg mt-24">
            <Card>
              <h3 className="card-title">Colour tokens · inspired by GL Bajaj (GLBITM)</h3>
              <div className="swatches">
                {TOKENS.map(([v, n]) => (
                  <div key={v} className="swatch"><span style={{ background: `var(${v})` }} /><strong>{n}</strong><code>{v}</code></div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="card-title">Buttons</h3>
              <div className="row wrap gap-12">
                <Button icon={PlusCircle}>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="danger-soft">Danger soft</Button>
                <Button variant="text">Text</Button>
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
              </div>
            </Card>
            <Card>
              <h3 className="card-title">Status badges</h3>
              <div className="row wrap gap-8">
                {['pending', 'approved', 'rejected', 'in_progress', 'awaiting_confirmation', 'resolved', 'reopened', 'OUT', 'IN', 'verified'].map((s) => <StatusBadge key={s} status={s} />)}
              </div>
            </Card>
            <Card>
              <h3 className="card-title">Inputs</h3>
              <div className="form-grid">
                <TextField label="Text input" placeholder="Placeholder" />
                <PasswordField />
                <TextField label="Date & time" type="datetime-local" />
                <SelectField label="Select" options={['Carpenter', 'Electricity']} placeholder="Choose" />
                <TextField label="With error" error="This field is required" />
                <TextField label="Disabled" disabled value="Read only" />
                <TextArea label="Textarea" maxLength={200} rows={3} value="" onChange={() => {}} />
                <div className="field"><span className="field__label">Search</span><SearchField value={q} onChange={setQ} /></div>
              </div>
            </Card>
            <div className="stat-grid">
              <StatCard label="Stat card" value={0} icon={Search} tone="copper" />
              <StatCard label="Loading" loading icon={Search} tone="sage" />
              <StatCard label="Amber tone" value={0} tone="amber" />
              <StatCard label="Brown tone" value={0} tone="brown" />
            </div>
            <Card>
              <h3 className="card-title">Feedback</h3>
              <div className="stack">
                <Notice tone="info" title="Info notice">Helpful context for the user.</Notice>
                <Notice tone="success" title="Success notice">Shown only after the server confirms.</Notice>
                <Notice tone="warning" title="Warning notice">Needs attention.</Notice>
                <Notice tone="error" title="Error notice">Server error message appears here.</Notice>
                <div className="row gap-12"><Spinner /><Skeleton width={200} /><Skeleton width={120} height={30} radius={99} /></div>
                <div className="row wrap gap-8">
                  <Button variant="secondary" onClick={() => toast.success('Toast success', 'Saved on the server')}>Success toast</Button>
                  <Button variant="secondary" onClick={() => toast.error('Toast error', 'Server rejected the request')}>Error toast</Button>
                  <Button variant="secondary" onClick={() => setModal(true)}>Confirmation modal</Button>
                </div>
              </div>
            </Card>
            <div className="two-col">
              <Card><EmptyState title="Empty state" message="Neutral message when there’s no data." /></Card>
              <Card><ErrorState error={{ message: 'Cannot reach the server.' }} onRetry={() => {}} /></Card>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={modal}
        onClose={() => setModal(false)}
        onConfirm={() => { toast.success('Confirmed', 'Example only — nothing was changed.'); setModal(false); }}
        tone="danger"
        title="Example confirmation"
        confirmLabel="Confirm"
        message="This is how irreversible actions such as Reject are confirmed."
      />
    </div>
  );
}
