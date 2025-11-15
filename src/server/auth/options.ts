import NextAuth from "next-auth";
import type { AuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import nodemailer from "nodemailer";

import { prisma } from "@/server/db/client";
import { buildMagicLinkEmail } from "@/server/auth/templates/magicLinkEmail";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      maxAge: 10 * 60, // 10 minutes
      async sendVerificationRequest({ identifier, url, provider }) {
        const transport = nodemailer.createTransport(provider.server);

        const { text, html } = buildMagicLinkEmail({ url });

        await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: "Your Schema Designer magic link",
          text,
          html,
        });
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const authInstance = NextAuth(authOptions);
export const { handlers, signIn, signOut } = authInstance;

