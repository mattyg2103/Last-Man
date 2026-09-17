import { requireUser } from "@/lib/session";
import AccountForms from "@/components/AccountForms";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="page-title">Account settings</h1>
      <AccountForms name={user.name} email={user.email} />
    </div>
  );
}
