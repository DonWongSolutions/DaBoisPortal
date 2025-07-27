
import { NextResponse } from 'next/server';
import { getUsers as readUsersData } from '@/lib/data';

export async function GET() {
  try {
    const users = await readUsersData();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Failed to get users:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
