'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { getWiseWords as getWiseWordsData, saveWiseWords } from '@/lib/data';
import type { WiseWord, WiseWordCategory } from '@/lib/types';


export async function createWiseWordAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized.' };
    }

    const newWiseWord: WiseWord = {
        id: Date.now(),
        phrase: formData.get('phrase') as string,
        author: formData.get('author') as string,
        context: formData.get('context') as string | undefined,
        addedBy: sessionUser.name,
        upvotes: [],
        pinned: false,
        category: 'Common',
    };

    const wiseWords = await getWiseWordsData();
    wiseWords.push(newWiseWord);
    await saveWiseWords(wiseWords);

    revalidatePath('/hall-of-fame');
    return { success: true, message: 'Wise words immortalized!' };
}

export async function getWiseWords() {
    return await getWiseWordsData();
}

export async function deleteWiseWordAction(wiseWordId: number) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }

    let wiseWords = await getWiseWordsData();
    wiseWords = wiseWords.filter(ww => ww.id !== wiseWordId);
    await saveWiseWords(wiseWords);

    revalidatePath('/hall-of-fame');
    return { success: true, message: 'Wise words removed.' };
}

export async function upvoteWiseWordAction(wiseWordId: number) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized.' };
    }

    const wiseWords = await getWiseWordsData();
    const wiseWord = wiseWords.find(ww => ww.id === wiseWordId);
    if (!wiseWord) {
        return { success: false, message: 'Wise word not found.' };
    }

    const userVoteIndex = wiseWord.upvotes.indexOf(sessionUser.id);
    if (userVoteIndex > -1) {
        // User has already upvoted, so remove their vote
        wiseWord.upvotes.splice(userVoteIndex, 1);
    } else {
        // User has not upvoted, so add their vote
        wiseWord.upvotes.push(sessionUser.id);
    }

    await saveWiseWords(wiseWords);
    revalidatePath('/hall-of-fame');
    return { success: true };
}

export async function pinWiseWordAction(wiseWordId: number) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }

    const wiseWords = await getWiseWordsData();
    const wiseWordToPin = wiseWords.find(ww => ww.id === wiseWordId);
    if (!wiseWordToPin) {
        return { success: false, message: 'Wise word not found.' };
    }

    // Toggle the pinned state
    wiseWordToPin.pinned = !wiseWordToPin.pinned;

    await saveWiseWords(wiseWords);
    revalidatePath('/hall-of-fame');
    revalidatePath('/login');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function updateWiseWordCategoryAction(wiseWordId: number, category: WiseWordCategory) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized.' };
    }
    
    const wiseWords = await getWiseWordsData();
    const wiseWord = wiseWords.find(ww => ww.id === wiseWordId);
    if (!wiseWord) {
        return { success: false, message: 'Wise word not found.' };
    }

    wiseWord.category = category;
    await saveWiseWords(wiseWords);

    revalidatePath('/hall-of-fame');
    return { success: true, message: 'Category updated.' };
}
