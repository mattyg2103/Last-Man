"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRoundStatus } from "@/lib/actions/admin";

const options = ["SCHEDULED", "OPEN", "CLOSED", "COMPLETED"];

export default function RoundStatusControl({ roundId, status }: { roundId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    const formData = new FormData();
    formData.set("roundId", roundId);
    formData.set("status", next);
    startTransition(async () => {
      await updateRoundStatus(formData);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button key={o} onClick={() => change(o)} disabled={pending} className={status === o ? "btn-primary" : "btn-secondary"}>
          {o}
        </button>
      ))}
    </div>
  );
}
