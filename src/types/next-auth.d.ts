import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      username: string | null;
      id: string;
      user_id: string;
      email: string;
      sid: string | null;
      wallet: number;

      // custom fields from Google
      name?: string | null;
      image?: string | null;
    };
  }
}

interface User {
  id: string;
  email: string;
  sid: string | null;
  created_at: string | null;
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    sid: string | null;
  }
}
