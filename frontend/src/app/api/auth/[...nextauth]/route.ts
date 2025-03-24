// frontend/src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers.
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  // Allow new sign-ins, even if switching accounts
  callbacks: {
    async signIn({ user, account, profile }) {
      // Always return true so that new (fresh) users can sign in.
      return true;
    },
    async jwt({ token, account, user }) {
      // When signing in with Google, account and user will be available
      if (account && user) {
        // Store the Google access token for future reference
        token.googleAccessToken = account.access_token;

        // Call your FastAPI Google auth endpoint to exchange the Google token
        // for your backend-issued JWT tokens. This works for both new and existing users.
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: account.access_token }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          token.customAccessToken = data.access_token;
          token.customRefreshToken = data.refresh_token;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose both the Google access token and your custom JWT tokens to the client
      session.user.googleAccessToken = token.googleAccessToken as string;
      session.user.customAccessToken = token.customAccessToken as string;
      session.user.customRefreshToken = token.customRefreshToken as string;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
