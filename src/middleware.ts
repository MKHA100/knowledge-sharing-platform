import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/upload(.*)",
  "/admin(.*)",
  "/api/documents/upload(.*)",
  "/api/comments(.*)",
  "/api/notifications(.*)",
  "/api/admin(.*)",
]);

// Routes that should be accessible without auth
const isPublicRoute = createRouteMatcher([
  "/",
  "/doc/(.*)",
  "/api/documents",
  "/api/documents/(.*)/view",
  "/api/search(.*)",
  "/api/webhooks/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
