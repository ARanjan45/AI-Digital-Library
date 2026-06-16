import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/library(.*)",
  "/book(.*)",
  "/upload(.*)",
  "/api/books(.*)",
  "/api/quiz(.*)",
  "/api/summary(.*)",
  "/api/progress(.*)",
  "/api/recommendations(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
