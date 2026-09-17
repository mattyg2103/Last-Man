import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = (req.nextauth.token as any)?.role;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (
      role === "ADMIN" &&
      ["/dashboard", "/games", "/notifications", "/account", "/help"].some((p) => pathname === p || pathname.startsWith(p + "/"))
    ) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/games/:path*", "/notifications/:path*", "/account/:path*", "/help/:path*"],
};
