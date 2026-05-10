import { withAuth } from "next-auth/middleware"

export default withAuth(
  function proxy() {
    // Add custom proxy logic here if needed.
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/booking/:path*",
    "/api/event-types/:path*",
    "/api/availability/:path*",
  ],
}
