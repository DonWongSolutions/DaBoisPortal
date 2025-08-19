'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { deleteSession, getSession, setSession } from '@/lib/auth';
import { getUsers, saveUsers } from '@/lib/data';
import type { User } from '@/lib/types';

export async function loginAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const password = formData.get('password') as string;

  if (!name || !password) {
    return { message: 'Please enter both name and password.' };
  }

  const users = await getUsers();
  const user = users.find((u) => u.name === name);

  if (!user || user.password !== password) {
    return { message: 'Invalid credentials. Please try again.' };
  }

  await setSession(user.name);
  if (user.forceInfoUpdate || user.forcePasswordChange) {
      redirect('/profile');
  } else {
      redirect('/dashboard');
  }
}

export async function logoutAction() {
  await deleteSession();
  redirect('/login');
}

function calculateAge(birthday: string): number {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export async function updateUserAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        redirect('/login');
    }

    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === sessionUser.id);
    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }

    const newPassword = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword && newPassword !== confirmPassword) {
        return { success: false, message: 'Passwords do not match.' };
    }
    
    const updatedUser: User = { ...users[userIndex] };
    updatedUser.email = formData.get('email') as string;
    updatedUser.phone = formData.get('phone') as string;
    
    if (formData.has('birthday') && formData.get('birthday')) {
        const birthday = formData.get('birthday') as string;
        updatedUser.birthday = birthday;
        updatedUser.age = calculateAge(birthday);
        updatedUser.forceInfoUpdate = false; // Turn off flag
    }

    const profilePicUrl = formData.get('profilePictureUrl') as string | null;
    if (profilePicUrl) {
        updatedUser.profilePictureUrl = profilePicUrl;
    }


    if (newPassword) {
        updatedUser.password = newPassword;
        updatedUser.forcePasswordChange = false; // Turn off flag
    }
    
    users[userIndex] = updatedUser;
    await saveUsers(users);

    // Re-authenticate user with potentially new details to update the session
    await setSession(updatedUser.name);
    
    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true, message: 'Profile updated successfully.' };
}

export async function adminUpdateUserAction(userId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }

    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }

    const updatedUser = { ...users[userIndex] };
    updatedUser.email = formData.get('email') as string;
    updatedUser.phone = formData.get('phone') as string;
    
    users[userIndex] = updatedUser;
    await saveUsers(users);
    
    revalidatePath('/admin');
    return { success: true, message: 'User updated successfully.' };
}

export async function adminUpdateUserFlagsAction(userId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }

    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }

    users[userIndex].forceInfoUpdate = formData.get('forceInfoUpdate') === 'on';
    users[userIndex].forcePasswordChange = formData.get('forcePasswordChange') === 'on';
    
    await saveUsers(users);
    
    revalidatePath('/admin');
    return { success: true, message: 'User flags updated successfully.' };
}


export async function resetPasswordAction(userId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }
    const newPassword = formData.get('password') as string;
    if (!newPassword) {
        return { success: false, message: 'Password cannot be empty.' };
    }

    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }

    users[userIndex].password = newPassword;
    await saveUsers(users);

    revalidatePath('/admin');
    return { success: true, message: 'Password reset successfully.' };
}

export async function getSessionAction() {
  return await getSession();
}
