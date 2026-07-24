import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith("/dashboard");
  const isSelectRole = pathname.startsWith("/auth/select-role");
  const isAdminPanel = pathname.startsWith("/control-panel-2026");

  if ((isDashboard || isSelectRole || isAdminPanel) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((isDashboard || isSelectRole || isAdminPanel) && user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, role_selected")
      .eq("id", user.id)
      .single();

    if (!profile?.role_selected && !isSelectRole) {
      return NextResponse.redirect(new URL("/auth/select-role", request.url));
    }

    if (isAdminPanel && profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isDashboard && profile?.role_selected) {
      const role = profile.role;
      if (pathname.startsWith("/dashboard/student") && role !== "student") {
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
      }
      if (pathname.startsWith("/dashboard/trainer") && role !== "trainer") {
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
      }
      if (pathname.startsWith("/dashboard/staff") && role !== "staff") {
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/select-role", "/control-panel-2026/:path*"],
};
