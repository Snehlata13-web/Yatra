import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, ChevronRight, UserRound, ShieldCheck, CalendarDays } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NAVIGATION, ROLE_LABEL, ROLE_HOME } from '../../config/app.config';
import { initials } from '../../utils/format';
import { Logo } from './Logo';
import { CampusSkyline } from '../ui/Illustration';

function SidebarNav({ role, onNavigate }) {
  const items = (NAVIGATION[role] || []).filter((i) => !i.hidden);
  return (
    <nav className="side-nav" aria-label={`${ROLE_LABEL[role]} navigation`}>
      <p className="side-nav__heading">{ROLE_LABEL[role]} workspace</p>
      <ul>
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={({ isActive }) => `side-nav__link ${isActive ? 'is-active' : ''}`} onClick={onNavigate}>
              <span className="side-nav__icon"><Icon size={19} aria-hidden /></span>
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SidebarFooter({ user, onSignOut }) {
  return (
    <div className="side-foot">
      <div className="side-foot__user">
        <span className="avatar avatar--gold">{initials(user.name)}</span>
        <span className="side-foot__meta">
          <strong>{user.name || 'Signed in'}</strong>
          <small>{ROLE_LABEL[user.role]}</small>
        </span>
      </div>
      <button type="button" className="side-foot__signout" onClick={onSignOut}>
        <LogOut size={17} aria-hidden /> Sign out
      </button>
    </div>
  );
}

function ProfileMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const hasProfile = user.role === 'student' || user.role === 'warden';

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="profile-menu" ref={ref}>
      <button type="button" className="profile-menu__trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="avatar">{initials(user.name)}</span>
        <span className="profile-menu__name">
          <strong>{user.name || 'Account'}</strong>
          <small>{ROLE_LABEL[user.role]}</small>
        </span>
        <ChevronDown size={16} className={`profile-menu__chev ${open ? 'is-open' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="profile-menu__pop" role="menu">
          <div className="profile-menu__head">
            <span className="avatar avatar--lg">{initials(user.name)}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>
          {hasProfile && (
            <Link role="menuitem" to={`${ROLE_HOME[user.role]}/profile`} className="profile-menu__item" onClick={() => setOpen(false)}>
              <UserRound size={17} aria-hidden /> My profile
            </Link>
          )}
          <button role="menuitem" type="button" className="profile-menu__item profile-menu__item--danger" onClick={onSignOut}>
            <LogOut size={17} aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Breadcrumb({ role, pathname }) {
  const items = NAVIGATION[role] || [];
  const match = [...items].sort((a, b) => b.to.length - a.to.length).find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol>
        <li><Link to={ROLE_HOME[role]}>{ROLE_LABEL[role]}</Link></li>
        {match && (
          <li aria-current="page"><ChevronRight size={14} aria-hidden /> <span>{match.label}</span></li>
        )}
      </ol>
    </nav>
  );
}

export function AppShell() {
  const { user, signOut } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);

  useEffect(() => {
    setDrawer(false);
    mainRef.current?.scrollTo?.({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [pathname]);

  // Reveal page sections that start below the fold as they scroll into view.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const root = mainRef.current;
    if (!root) return undefined;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.setAttribute('data-reveal', 'shown');
          io.unobserve(e.target);
        }
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    const t = setTimeout(() => {
      root.querySelectorAll('.content__inner > .stack-xl > *').forEach((el) => {
        if (el.getBoundingClientRect().top > window.innerHeight) {
          el.setAttribute('data-reveal', 'pending');
          io.observe(el);
        }
      });
    }, 60);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', drawer);
    if (!drawer) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>

      <aside className="sidebar" aria-label="Primary">
        <div className="sidebar__brand"><Logo /></div>
        <SidebarNav role={user.role} />
        <CampusSkyline className="sidebar__skyline" />
        <SidebarFooter user={user} onSignOut={handleSignOut} />
      </aside>

      <header className="mobilebar">
        <button type="button" className="mobilebar__menu" onClick={() => setDrawer(true)} aria-label="Open navigation" aria-expanded={drawer}>
          <Menu size={22} />
        </button>
        <Logo />
        {['student', 'warden'].includes(user.role) ? (
          <Link to={`${ROLE_HOME[user.role]}/profile`} className="avatar avatar--gold avatar--sm mobilebar__avatar" aria-label="My profile">{initials(user.name)}</Link>
        ) : (
          <span className="avatar avatar--gold avatar--sm" aria-label={user.name}>{initials(user.name)}</span>
        )}
      </header>

      <div className={`mdrawer ${drawer ? 'is-open' : ''}`} aria-hidden={!drawer}>
        <div className="mdrawer__scrim" onClick={() => setDrawer(false)} />
        <aside className="mdrawer__panel" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="mdrawer__head">
            <Logo />
            <button type="button" className="mobilebar__menu" onClick={() => setDrawer(false)} aria-label="Close navigation" tabIndex={drawer ? 0 : -1}>
              <X size={22} />
            </button>
          </div>
          {drawer && <SidebarNav role={user.role} onNavigate={() => setDrawer(false)} />}
          <SidebarFooter user={user} onSignOut={handleSignOut} />
        </aside>
      </div>

      <div className="main">
        <header className="topbar">
          <Breadcrumb role={user.role} pathname={pathname} />
          <div className="topbar__right">
            <span className="date-pill"><CalendarDays size={14} aria-hidden /> {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span className="role-pill"><ShieldCheck size={14} aria-hidden /> {ROLE_LABEL[user.role]}</span>
            <ProfileMenu user={user} onSignOut={handleSignOut} />
          </div>
        </header>
        <main id="main" className="content" ref={mainRef} tabIndex={-1}>
          <div className="content__inner page-enter" key={pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
