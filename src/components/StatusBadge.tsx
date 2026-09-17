const entryStatusLabels: Record<string, { label: string; className: string; icon: string }> = {
  ACTIVE: { label: "Active", className: "badge-active", icon: "●" },
  ELIMINATED: { label: "Eliminated", className: "badge-eliminated", icon: "✕" },
  REBUY_ELIGIBLE: { label: "Re-buy eligible", className: "badge-rebuy", icon: "↻" },
  WINNER: { label: "Winner", className: "badge-winner", icon: "★" },
};

const gameStatusLabels: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open for entries", className: "badge-neutral" },
  ACTIVE: { label: "Active", className: "badge-active" },
  PAUSED: { label: "Paused", className: "badge-rebuy" },
  COMPLETED: { label: "Completed", className: "badge-winner" },
  ARCHIVED: { label: "Archived", className: "badge-eliminated" },
};

const paymentStatusLabels: Record<string, { label: string; className: string }> = {
  NOT_CONFIRMED: { label: "Not confirmed", className: "badge-warning" },
  PAID: { label: "Paid", className: "badge-active" },
  PAYMENT_ISSUE: { label: "Payment issue", className: "badge-warning" },
  REFUNDED: { label: "Refunded", className: "badge-neutral" },
};

const roundStatusLabels: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: "Scheduled", className: "badge-neutral" },
  OPEN: { label: "Open", className: "badge-active" },
  CLOSED: { label: "Closed", className: "badge-rebuy" },
  COMPLETED: { label: "Completed", className: "badge-winner" },
};

const fixtureStatusLabels: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: "Scheduled", className: "badge-neutral" },
  IN_PROGRESS: { label: "In progress", className: "badge-active" },
  COMPLETED: { label: "Full time", className: "badge-winner" },
  POSTPONED: { label: "Postponed", className: "badge-warning" },
  CANCELLED: { label: "Cancelled", className: "badge-warning" },
  ABANDONED: { label: "Abandoned", className: "badge-warning" },
};

export function EntryStatusBadge({ status }: { status: string }) {
  const s = entryStatusLabels[status] ?? { label: status, className: "badge-neutral", icon: "" };
  return (
    <span className={s.className}>
      <span aria-hidden>{s.icon}</span> {s.label}
    </span>
  );
}

export function GameStatusBadge({ status }: { status: string }) {
  const s = gameStatusLabels[status] ?? { label: status, className: "badge-neutral" };
  return <span className={s.className}>{s.label}</span>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const s = paymentStatusLabels[status] ?? { label: status, className: "badge-neutral" };
  return <span className={s.className}>{s.label}</span>;
}

export function RoundStatusBadge({ status }: { status: string }) {
  const s = roundStatusLabels[status] ?? { label: status, className: "badge-neutral" };
  return <span className={s.className}>{s.label}</span>;
}

export function FixtureStatusBadge({ status }: { status: string }) {
  const s = fixtureStatusLabels[status] ?? { label: status, className: "badge-neutral" };
  return <span className={s.className}>{s.label}</span>;
}
