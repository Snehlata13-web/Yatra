import { ShieldCheck, Ticket, Wrench, UtensilsCrossed } from 'lucide-react';
import { Logo } from './Logo';
import { CampusSkyline } from '../ui/Illustration';

const POINTS = [
  { icon: Ticket, title: 'Digital hostel passes', text: 'Request, approve and verify outings without paper slips.' },
  { icon: Wrench, title: 'Maintenance that closes the loop', text: 'Complaints are resolved only when the student confirms.' },
  { icon: UtensilsCrossed, title: 'Daily meal feedback', text: 'Honest reviews for every breakfast, lunch, snacks and dinner.' },
];

export function AuthLayout({ children }) {
  return (
    <div className="auth">
      <aside className="auth__brand">
        <div className="auth__pattern" aria-hidden />
        <div className="auth__glow" aria-hidden />
        <CampusSkyline className="auth__skyline" />
        <div className="auth__brand-inner">
          <Logo />
          <div className="auth__hero">
            <p className="eyebrow eyebrow--gold">Campus residence, simplified</p>
            <h1>
              Every journey out
              <br />
              begins with <em>trust.</em>
            </h1>
            <p className="auth__lead">
              Yatra connects students, wardens and gate staff in one secure hostel workspace.
            </p>
          </div>
          <ul className="auth__points">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="auth__point-icon"><Icon size={18} aria-hidden /></span>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
              </li>
            ))}
          </ul>
          <p className="auth__secure"><ShieldCheck size={15} aria-hidden /> Role-based access · Encrypted sessions</p>
        </div>
      </aside>
      <main className="auth__panel">
        <div className="auth__mobile-logo"><Logo tone="dark" /></div>
        <div className="auth__card page-enter">{children}</div>
      </main>
    </div>
  );
}
