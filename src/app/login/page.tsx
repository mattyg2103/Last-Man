import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");

  return (
    <div className="max-w-sm mx-auto card mt-10">
      <h1 className="section-title">Log in</h1>
      <LoginForm />
      <p className="text-sm text-gray-500 mt-4">
        New here? <Link href="/register" className="text-pitch-700 font-semibold underline">Create an account</Link>
      </p>
    </div>
  );
}
