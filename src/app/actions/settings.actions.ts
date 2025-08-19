'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { saveSettings } from '@/lib/data';

export async function updateSettingsAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }
    try {
         const newSettings = {
            maintenanceMode: formData.get('maintenanceMode') === 'on',
            loginImageUrl: formData.get('loginImageUrl') as string,
            dashboardBannerUrl: formData.get('dashboardBannerUrl') as string,
        };
        await saveSettings(newSettings);
        revalidatePath('/admin');
        revalidatePath('/login');
        revalidatePath('/dashboard');
        return { success: true, message: 'Settings updated successfully.' };
    } catch (error) {
        return { success: false, message: 'Failed to update settings.' };
    }
}
