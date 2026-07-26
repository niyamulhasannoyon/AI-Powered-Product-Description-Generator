import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function checkAdminSession(customSession?: any) {
  const session = customSession || (await getServerSession(authOptions));

  if (!session || !session.user) {
    return { isAdmin: false, session: null, error: 'Unauthorized. Session missing.' };
  }

  const role = (session.user as { role?: string }).role;
  const email = session.user.email?.toLowerCase();

  const isAdmin = role === 'admin' || email === 'niyamulhasan1089@gmail.com';

  if (!isAdmin) {
    return { isAdmin: false, session, error: 'Forbidden. Admin access required.' };
  }

  return { isAdmin: true, session, error: null };
}
