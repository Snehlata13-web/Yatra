import {
  LayoutDashboard, Ticket, PlusCircle, Wrench, UtensilsCrossed, UserRound,
  ClipboardCheck, ShieldCheck, ScanLine, BadgeCheck, UserCheck, Megaphone, Users, CalendarCheck,
} from 'lucide-react';

export const ROLES = {
  STUDENT: 'student',
  WARDEN: 'warden',
  GUARD: 'guard',
  ADMIN: 'admin',
};

export const ROLE_LABEL = {
  student: 'Student',
  warden: 'Warden',
  guard: 'Gate Guard',
  admin: 'Administrator',
};

export const ROLE_HOME = {
  student: '/student',
  warden: '/warden',
  guard: '/guard',
  admin: '/admin',
};

/** Role-based navigation. `hidden` items are reachable from the profile menu only (not the sidebar). */
export const NAVIGATION = {
  student: [
    { to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/student/passes', label: 'My Passes', icon: Ticket, end: true },
    { to: '/student/passes/new', label: 'Request a Pass', icon: PlusCircle },
    { to: '/student/complaints', label: 'Complaints', icon: Wrench },
    { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/student/food', label: 'Food Reviews', icon: UtensilsCrossed },
    { to: '/student/notices', label: 'Notices', icon: Megaphone },
    { to: '/student/profile', label: 'My Profile', icon: UserRound, hidden: true },
  ],
  warden: [
    { to: '/warden', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/warden/passes', label: 'Pass Approvals', icon: ClipboardCheck },
    { to: '/warden/students', label: 'Students', icon: Users },
    { to: '/warden/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/warden/complaints', label: 'Complaints', icon: Wrench },
    { to: '/warden/food', label: 'Food Reviews', icon: UtensilsCrossed },
    { to: '/warden/notices', label: 'Notices', icon: Megaphone },
    { to: '/warden/profile', label: 'My Profile', icon: UserRound, hidden: true },
  ],
  guard: [
    { to: '/guard', label: 'Gate Desk', icon: ScanLine, end: true },
    { to: '/guard/verified', label: 'Verified Passes', icon: BadgeCheck },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/accounts', label: 'Staff Approvals', icon: UserCheck },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/admin/passes', label: 'Passes', icon: Ticket },
    { to: '/admin/complaints', label: 'Complaints', icon: Wrench },
    { to: '/admin/food', label: 'Food Reviews', icon: UtensilsCrossed },
    { to: '/admin/notices', label: 'Notices', icon: Megaphone },
  ],
};

export const WORKSPACE_ICON = {
  student: Ticket,
  warden: ShieldCheck,
  guard: ScanLine,
  admin: UserCheck,
};

export const PASS_STATUS = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' };

export const GATE_STAGE = { OUT: 'OUT', IN: 'IN' };

export const COMPLAINT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  AWAITING: 'awaiting_confirmation',
  RESOLVED: 'resolved',
  REOPENED: 'reopened',
};

export const COMPLAINT_CATEGORIES = ['Carpenter', 'Electricity', 'Plumber', 'Other'];

/** Allowed warden transitions. Resolved is only set by the student. */
export const WARDEN_COMPLAINT_ACTIONS = {
  pending: { next: 'in_progress', label: 'Start work' },
  in_progress: { next: 'awaiting_confirmation', label: 'Mark work done' },
  reopened: { next: 'in_progress', label: 'Resume work' },
};

export const MEALS = [
  { key: 'breakfast', label: 'Breakfast', time: '7:30 – 9:30 AM' },
  { key: 'lunch', label: 'Lunch', time: '12:30 – 2:30 PM' },
  { key: 'snacks', label: 'Snacks', time: '5:00 – 6:00 PM' },
  { key: 'dinner', label: 'Dinner', time: '8:00 – 10:00 PM' },
];
