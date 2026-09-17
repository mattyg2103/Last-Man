"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export default function FormAction({
  action,
  hidden,
  label,
  className = "btn-primary",
  confirmText,
  onSuccess,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  hidden: Record<string, string>;
  label: string;
  className?: string;
  confirmText?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<ActionResult | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirmText && !window.confirm(confirmText)) return;
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(formData);
      setFeedback(result);
      if (result.ok) {
        router.refresh();
        onSuccess?.();
      }
    });
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        {Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <button type="submit" className={className} disabled={pending}>
          {pending ? "Please wait…" : label}
        </button>
      </form>
      {feedback && (
        <p role="status" className={`text-sm mt-1 ${feedback.ok ? "text-pitch-700" : "text-red-600"}`}>
          {feedback.ok ? feedback.message : feedback.error}
        </p>
      )}
    </div>
  );
}
