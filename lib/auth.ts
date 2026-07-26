import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { ADMIN_EMAILS } from '@/lib/admin';

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Email and password are required');
      }

      const emailLower = credentials.email.toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email: emailLower },
      });

      if (!user || !user.passwordHash) {
        throw new Error('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      const role = (user as { role?: string }).role || (ADMIN_EMAILS.includes(emailLower) ? 'admin' : 'user');

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: role,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const emailLower = user.email.toLowerCase();
        let dbUser = await prisma.user.findUnique({
          where: { email: emailLower },
        });

        if (!dbUser) {
          const isInitialAdmin = ADMIN_EMAILS.includes(emailLower);
          dbUser = await prisma.user.create({
            data: {
              email: emailLower,
              name: user.name || '',
              plan: 'free',
              role: isInitialAdmin ? 'admin' : 'user',
            },
          });
        }
        user.id = dbUser.id;
        (user as { role?: string }).role = dbUser.role || (ADMIN_EMAILS.includes(emailLower) ? 'admin' : 'user');
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as { plan?: string }).plan || 'free';
        const userEmail = user.email?.toLowerCase();
        token.role = (user as { role?: string }).role || (userEmail && ADMIN_EMAILS.includes(userEmail) ? 'admin' : 'user');
        if (user.image) token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { plan?: string }).plan = (token.plan as string) || 'free';
        const userEmail = session.user.email?.toLowerCase();
        (session.user as { role?: string }).role = (token.role as string) || (userEmail && ADMIN_EMAILS.includes(userEmail) ? 'admin' : 'user');
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
};
