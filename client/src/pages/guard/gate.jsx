import { useState } from 'react';
import { ShieldCheck, ShieldAlert, LogOut, LogIn, CheckCircle2 } from 'lucide-react';
import { useAction } from '../../hooks/useResource';
import { passApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { Button, ConfirmModal, DetailList, StatusBadge } from '../../components/ui';
import { PassCard } from '../../components/domain/Pass';
import { formatDateTime, shortId } from '../../utils/format';

const COPY = {
  verifyOut: {
    title: 'Verify pass and let the student out?',
    message: 'Check the student’s ID against the details below. The pass will be verified and marked OUT in one step.',
    confirm: 'Verify & mark OUT',
    tone: 'primary',
    done: 'Verified · marked OUT',
  },
  verify: {
    title: 'Verify this pass?',
    message: 'Confirm the student and pass details match. Gate movement can be recorded after verification.',
    confirm: 'Verify pass',
    tone: 'primary',
    done: 'Pass verified',
  },
  out: {
    title: 'Record student leaving (OUT)?',
    message: 'The pass will move to OUT. This can only be recorded once.',
    confirm: 'Mark OUT',
    tone: 'primary',
    done: 'Marked OUT',
  },
  in: {
    title: 'Record student returning (IN)?',
    message: 'The pass will move to IN and the trip will be completed.',
    confirm: 'Mark IN',
    tone: 'success',
    done: 'Marked IN',
  },
};

/** Which gate action is allowed for this pass, enforcing the workflow. */
export const nextGateAction = (p) => {
  if (p.status !== 'approved') return null;
  if (!p.guardVerified) return 'verify';
  if (!p.currentStage) return 'out';
  if (p.currentStage === 'OUT') return 'in';
  return null;
};

export function useGateActions(onDone) {
  const toast = useToast();
  const [target, setTarget] = useState(null); // { pass, kind }
  const action = useAction(async ({ pass, kind }) => {
    // Returns the saved pass row from the backend (OUT/IN return it; verify returns the approval).
    if (kind === 'verifyOut') {
      await passApi.verify(pass.id);
      return passApi.markOut(pass.id);
    }
    if (kind === 'verify') return passApi.verify(pass.id);
    if (kind === 'out') return passApi.markOut(pass.id);
    return passApi.markIn(pass.id);
  });

  const confirm = async () => {
    try {
      const saved = await action.run(target);
      toast.success(COPY[target.kind].done, target.pass.student?.name || `${shortId(target.pass.id)} · ${target.pass.destination}`);
      setTarget(null);
      onDone(target.pass, target.kind, saved);
    } catch {
      // If verification succeeded but OUT failed, reload so the card shows the real state.
      if (target.kind === 'verifyOut') onDone(target.pass, 'partial');
    }
  };

  const modal = (
    <ConfirmModal
      open={Boolean(target)}
      onClose={() => { setTarget(null); action.clearError(); }}
      onConfirm={confirm}
      loading={action.pending}
      error={action.error}
      tone={target ? COPY[target.kind].tone : 'primary'}
      title={target ? COPY[target.kind].title : ''}
      confirmLabel={target ? COPY[target.kind].confirm : ''}
      message={target ? COPY[target.kind].message : ''}
    >
      {target && (
        <DetailList items={[
          { label: 'Pass ID', value: String(target.pass.id) },
          target.pass.student && { label: 'Student', value: target.pass.student.name },
          target.pass.student && { label: 'Roll · Course', value: [target.pass.student.rollNumber, target.pass.student.course, target.pass.student.branch].filter(Boolean).join(' · ') },
          target.pass.student && { label: 'Room · Block', value: [target.pass.student.roomNumber, target.pass.student.blockNumber].filter(Boolean).join(' · ') || undefined },
          { label: 'Destination', value: target.pass.destination },
          { label: 'Departure', value: formatDateTime(target.pass.departureTime) },
          { label: 'Return', value: formatDateTime(target.pass.returnTime) },
          { label: 'Current stage', value: <StatusBadge status={target.pass.currentStage || 'not_left'} size="sm" /> },
        ]} />
      )}
    </ConfirmModal>
  );

  return { open: (pass, kind) => setTarget({ pass, kind }), modal };
}

export function GatePassCard({ pass, onAction, onOpen }) {
  const next = nextGateAction(pass);
  const canOut = next === 'out';
  const canIn = next === 'in';
  return (
    <PassCard
      pass={pass}
      className="pass-card--gate"
      onOpen={onOpen}
      openLabel="View full details"
      showJourney
      actions={
        pass.status !== 'approved' ? (
          <span className="done-note done-note--warn"><ShieldAlert size={16} aria-hidden /> {pass.status === 'rejected' ? 'Rejected by warden — do not allow exit' : 'Not approved by warden yet — do not allow exit'}</span>
        ) : next === 'verify' ? (
          <div className="gate-actions" role="group" aria-label="Verify pass">
            <Button icon={LogOut} onClick={() => onAction(pass, 'verifyOut')}>Verify &amp; mark OUT</Button>
            <Button variant="secondary" icon={ShieldCheck} onClick={() => onAction(pass, 'verify')}>Verify only</Button>
          </div>
        ) : next === null ? (
          <span className="done-note"><CheckCircle2 size={16} aria-hidden /> Trip completed</span>
        ) : (
          <div className="gate-actions" role="group" aria-label="Gate movement">
            <Button variant={canOut ? 'primary' : 'secondary'} icon={LogOut} disabled={!canOut} onClick={() => onAction(pass, 'out')} title={!canOut ? 'Already marked OUT' : undefined}>Mark OUT</Button>
            <Button variant={canIn ? 'success' : 'secondary'} icon={LogIn} disabled={!canIn} onClick={() => onAction(pass, 'in')} title={!canIn ? 'Available after OUT' : undefined}>Mark IN</Button>
          </div>
        )
      }
    />
  );
}
