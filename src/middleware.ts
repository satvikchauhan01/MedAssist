import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token"
  });
  const url = request.nextUrl; 

  // redirect unauthenticated users away from protected pages and API routes
  if (
    !token &&
    (
      url.pathname.startsWith("/dashboard") ||
      url.pathname.startsWith("/doctor") ||
      url.pathname === "/info" ||
      url.pathname === "/chatbot" ||
      url.pathname.startsWith("/api/session") ||
      url.pathname.startsWith("/api/chat") ||
      url.pathname === "/Home"
    )
  ) {
      if (url.pathname.startsWith("/api/")) {
        return Response.json({
          success: false,
          message: "Unauthorized. Please sign in first."
        }, { status: 401 })
      }
        return NextResponse.redirect(new URL("/signIn", request.url));
    }

    //  2. REDIRECT AWAY FROM AUTH PAGES
  if (
    token &&
    (url.pathname === "/signIn" ||
      url.pathname === "/signUp" ||
      url.pathname === "/" ) 
  ) {
    if (token.role === "doctor") {
      return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/Home", request.url));
  }

  // redirect doctors away from /Home to doctor dashboard
  if (token && token.role === "doctor" && url.pathname === "/Home") {
      return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
  }

    if (
      token &&
      token.isNewUser === true &&
      url.pathname !== "/info" &&  // prevent infinite loop
      !url.pathname.startsWith("/doctor") &&
      !url.pathname.startsWith("/api/")
    ) {
      return NextResponse.redirect(new URL("/info", request.url));
    }

  // doctor trying to access user dashboard
  if (token && token.role === "doctor" && url.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
  }

  // user trying to access doctor dashboard
  if (token && token.role === "user" && url.pathname.startsWith("/doctor")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/signIn",
    "/signUp",
    "/verify/:path*",  // still in matcher so middleware runs, but no redirect
    "/",
    "/dashboard",
    "/dashboard/:path*",
    "/info",
    "/doctor",
    "/doctor/:path*",
    "/chatbot",
    "/api/session/:path*",
    "/api/chat",
    "/Home",
    "/api/slots/:path*",
    "/api/appointments/:path*",
    "/appointment",
    "/api/doctors/:path*",
    "/api/notifications/:path*",
    "/api/payments/create-order",
    "/api/payments/verify",
    "/nearby",
    "/appointments",                              // new page
    "/api/appointments/cancel-by-patient",        // new API
  ],
};