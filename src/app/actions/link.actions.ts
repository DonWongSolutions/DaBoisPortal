'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { getLinks, saveLinks } from '@/lib/data';
import type { Link as LinkType } from '@/lib/types';

export async function createLinkAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized.' };
    }

    try {
        const tags = (formData.get('tags') as string)
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        const newLink: LinkType = {
            id: Date.now(),
            url: formData.get('url') as string,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            tags: tags,
            createdBy: sessionUser.name,
            createdAt: new Date().toISOString(),
            ratings: [],
        };

        const links = await getLinks();
        links.push(newLink);
        await saveLinks(links);

        revalidatePath('/linkboard');
        return { success: true, message: 'Link added successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to add link.' };
    }
}

export async function updateLinkAction(linkId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized.' };
    }
    
    try {
        const links = await getLinks();
        const linkIndex = links.findIndex(l => l.id === linkId);
        if (linkIndex === -1) {
            return { success: false, message: 'Link not found.' };
        }
        
        const link = links[linkIndex];
        if (sessionUser.role !== 'admin' && sessionUser.name !== link.createdBy) {
            return { success: false, message: 'You are not authorized to edit this link.' };
        }
        
        const tags = (formData.get('tags') as string)
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        const updatedLink: LinkType = {
            ...link,
            url: formData.get('url') as string,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            tags: tags,
        };

        links[linkIndex] = updatedLink;
        await saveLinks(links);

        revalidatePath('/linkboard');
        return { success: true, message: 'Link updated successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to update link.' };
    }
}

export async function deleteLinkAction(linkId: number) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized.' };
    }
    
    try {
        const links = await getLinks();
        const linkIndex = links.findIndex(l => l.id === linkId);
        if (linkIndex === -1) {
            return { success: false, message: 'Link not found.' };
        }
        
        const link = links[linkIndex];
        if (sessionUser.role !== 'admin' && sessionUser.name !== link.createdBy) {
            return { success: false, message: 'You are not authorized to delete this link.' };
        }

        links.splice(linkIndex, 1);
        await saveLinks(links);

        revalidatePath('/linkboard');
        return { success: true, message: 'Link deleted successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to delete link.' };
    }
}

export async function rateLinkAction(linkId: number, rating: number) {
     const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized.' };
    }
    if (rating < 1 || rating > 5) {
        return { success: false, message: 'Invalid rating.' };
    }
    
    try {
        const links = await getLinks();
        const linkIndex = links.findIndex(l => l.id === linkId);
        if (linkIndex === -1) {
            return { success: false, message: 'Link not found.' };
        }

        const link = links[linkIndex];
        const existingRatingIndex = link.ratings.findIndex(r => r.userId === sessionUser.id);
        
        if (existingRatingIndex > -1) {
            link.ratings[existingRatingIndex].rating = rating;
        } else {
            link.ratings.push({ userId: sessionUser.id, rating });
        }
        
        await saveLinks(links);
        revalidatePath('/linkboard');
        return { success: true, message: 'Rating submitted.' };
    } catch (error) {
         console.error(error);
        return { success: false, message: 'Failed to submit rating.' };
    }
}

export async function getLinksAction() {
    return await getLinks();
}
