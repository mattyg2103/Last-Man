import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  const session = await getSession();
  if (session?.user) redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");

  return (
    <div className="max-w-sm mx-auto card mt-10">
      <h1 className="section-title">Create your account</h1>
      <RegisterForm />
      <p className="text-sm text-gray-500 mt-4">
        Already have an account? <Link href="/login" className="text-pitch-700 font-semibold underline">Log in</Link>
      </p>
    </div>
  );
}
