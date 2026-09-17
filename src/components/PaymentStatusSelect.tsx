"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePaymentStatus } from "@/lib/actions/admin";

const options = ["NOT_CONFIRMED", "PAID", "PAYMENT_ISSUE", "REFUNDED"];

export default function PaymentStatusSelect({ entryId, currentStatus }: { entryId: string; currentStatus: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const formData = new FormData();
    formData.set("entryId", entryId);
    formData.set("paymentStatus", e.target.value);
    startTransition(async () => {
      await updatePaymentStatus(formData);
      router.refresh();
    });
  }

  return (
    <select className="input !py-1 !text-xs w-auto" defaultValue={currentStatus} onChange={onChange} disabled={pending} aria-label="Payment status">
      {options.map((o) => (
        <option key={o} value={o}>{o.replaceAll("_", " ")}</option>
      ))}
    </select>
  );
}
