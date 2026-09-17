"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateParticipantStatus } from "@/lib/actions/admin";

const options = ["ACTIVE", "ELIMINATED", "REBUY_ELIGIBLE", "WINNER"];

export default function EntryStatusSelect({ entryId, currentStatus }: { entryId: string; currentStatus: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const formData = new FormData();
    formData.set("entryId", entryId);
    formData.set("status", e.target.value);
    startTransition(async () => {
      await updateParticipantStatus(formData);
      router.refresh();
    });
  }

  return (
    <select className="input !py-1 !text-xs w-auto" defaultValue={currentStatus} onChange={onChange} disabled={pending} aria-label="Participant status">
      {options.map((o) => (
        <option key={o} value={o}>{o.replaceAll("_", " ")}</option>
      ))}
    </select>
  );
}
