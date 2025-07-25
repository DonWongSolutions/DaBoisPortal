import { cookies } from 'next/headers';
import type { User } from './types';
import { getUsers as readUsers } from './data';

const SESSION_COOKIE_NAME = 'da_bois_session';

// This function is marked as 'server-only' implicitly by using `cookies()`
// but we are being explicit here.
import 'server-only';

export async function setSession(username: string) {
  cookies().set(SESSION_COOKIE_NAME, username, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // One week
    path: '/',
  });
}

export async function getSession(): Promise<User | null> {
  const cookieStore = cookies();
  const username = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!username) {
    return null;
  }

  const users = await readUsers();
  const user = users.find((u) => u.name === username);

  if (!user) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function deleteSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
