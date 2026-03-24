import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/signup";
  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/conversations") ||
    path.startsWith("/leads") ||
    path.startsWith("/settings");

  const redirect = (pathname: string) => {
    const u = request.nextUrl.clone();
    u.pathname = pathname;
    const res = NextResponse.redirect(u);
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      res.cookies.set(name, value);
    });
    return res;
  };

  if (!user && isProtected) {
    return redirect("/login");
  }

  if (user && isAuthPage) {
    return redirect("/dashboard");
  }

  if (path === "/" && user) {
    return redirect("/dashboard");
  }

  if (path === "/" && !user) {
    return redirect("/login");
  }

  return supabaseResponse;
}
