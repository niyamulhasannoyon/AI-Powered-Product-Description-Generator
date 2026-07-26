import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const ADMIN_EMAILS = [
  'niyamulhasan1089@gmail.com',
  'niyamulhasanbd@gmail.com',
];

export async function checkAdminSession(customSession?: any) {
  const session = customSession || (await getServerSession(authOptions));

  if (!session || !session.user) {
    return { isAdmin: false, session: null, error: 'Unauthorized. Session missing.' };
  }

  const role = (session.user as { role?: string }).role;
  const email = session.user.email?.toLowerCase();

  const isAdmin =
    (email && ADMIN_EMAILS.includes(email)) ||
    role === 'admin';

  if (!isAdmin) {
    return { isAdmin: false, session, error: 'Forbidden. Admin access required.' };
  }

  return { isAdmin: true, session, error: null };
}
