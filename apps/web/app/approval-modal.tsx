'use client';

import { useEffect, useRef } from 'react';
import type { Proposal } from '../../../packages/shared/src';
import { en } from '../../../packages/shared/src/messages/en';

export function ApprovalModal({ proposal, now, busy, error, onApprove, onDismiss }: {
  proposal: Proposal; now: number; busy: boolean; error: string;
  onApprove: () => void; onDismiss: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const remaining = Math.max(0, Math.ceil((proposal.expires - now) / 1000));
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);

  return <dialog ref={dialog} aria-labelledby="approval-title" aria-describedby="approval-description"
    onCancel={event => { event.preventDefault(); if (!busy) onDismiss(); }}
    className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border border-violet-400/40 bg-panel p-6 text-white shadow-2xl backdrop:bg-black/70">
    <p className="mb-2 text-xs uppercase tracking-widest text-accent">{en.proposals} · {proposal.origin}</p>
    <h2 id="approval-title" className="text-2xl font-semibold">{proposal.kind}</h2>
    <p id="approval-description" className="mt-3 text-sm text-muted">{proposal.reason}</p>
    <p className="my-5 text-sm tabular-nums">{en.expiresIn} {remaining} {en.seconds}</p>
    {error && <p role="alert" className="mb-4 text-sm text-rose-200">{error}</p>}
    <div className="flex justify-end gap-3">
      <button autoFocus className="btn" disabled={busy} onClick={onDismiss}>{en.dismiss}</button>
      <button className="btn primary" disabled={busy || remaining === 0} onClick={onApprove}>{en.approve}</button>
    </div>
  </dialog>;
}
