// lib/authOptions.ts

import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createUserIfNotExists } from "@/lib/createUserIfNotExists";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        username: { label: "Username", type: "text" },
        action: { label: "Action", type: "text" }, // signup | signin
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { email, password, username, action } = credentials;

        // -------------------------
        // CREDENTIALS SIGNUP
        // -------------------------
        if (action === "signup") {
          if (!username) return null;

          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: username,
              username,
            },
          });

          if (error || !data.user) return null;

          return {
            id: data.user.id,
            email: data.user.email!,
            name: username,
            _isSignup: true, // ← mark signup
          };
        }

        // -------------------------
        // CREDENTIALS SIGN-IN
        // -------------------------
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.user) return null;

        return {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata.full_name || null,
          _isSignup: false,
        };
      },
    }),
  ],

  callbacks: {
    // ---------------------------------------
    // RUN ON EVERY SIGN-IN
    // ---------------------------------------
    async signIn({ user, account }) {
      const isGoogle = account?.provider === "google";
      const isSignup = (user as any)._isSignup === true;

      if (isGoogle || isSignup) {
        try {
          await createUserIfNotExists(
            user.id!,
            user.email!,
            user.name || undefined
          );
        } catch (err: any) {
          // If duplicate key error (Supabase throws code 23505)
          if (err.code === "23505" || err.message?.includes("duplicate")) {
            // Redirect to signin with query param

            return false;
          }
          console.error("Error creating user:", err);
          return false;
        }
      }

      return true;
    },

    // ---------------------------------------
    // JWT CALLBACK
    // ---------------------------------------
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email as string;
        token.username = user.name;
      }

      const { data } = await supabaseAdmin
        .from("users")
        .select("wallet, id")
        .eq("email", token.email)
        .maybeSingle();

      if (data) {
        token.wallet = data.wallet;
        token.user_id = data.id;
      }

      return token;
    },

    // ---------------------------------------
    // SESSION CALLBACK
    // ---------------------------------------
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.user_id = token.user_id as string;
      session.user.email = token.email as string;
      session.user.username = token.username as string;
      session.user.wallet = token.wallet as number;
      return session;
    },
  },

  pages: {
    signIn: "/signin",
    error: "/signin",
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
