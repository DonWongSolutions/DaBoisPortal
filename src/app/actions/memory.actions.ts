'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { getMemories, saveMemories } from '@/lib/data';
import type { Memory } from '@/lib/types';

export async function getMemoriesAction() {
    return (await getMemories()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getMemoryByIdAction(id: number) {
    const memories = await getMemories();
    return memories.find(m => m.id === id) || null;
}


export async function createMemoryAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized.' };
    }

    const imageUrls = (formData.get('imageUrls') as string)
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

    const newMemory: Memory = {
        id: Date.now(),
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        date: formData.get('date') as string,
        imageUrls: imageUrls,
        createdBy: sessionUser.name,
        comments: [],
    };

    const memories = await getMemories();
    memories.push(newMemory);
    await saveMemories(memories);

    revalidatePath('/memories');
    redirect('/memories');
}

export async function updateMemoryAction(memoryId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized.' };
    }
    
    const memories = await getMemories();
    const memoryIndex = memories.findIndex(m => m.id === memoryId);
    if (memoryIndex === -1) {
        return { success: false, message: 'Memory not found.' };
    }

    const memory = memories[memoryIndex];
    if (sessionUser.role !== 'admin' && sessionUser.name !== memory.createdBy) {
         return { success: false, message: 'You are not authorized to edit this memory.' };
    }
    
    const imageUrls = (formData.get('imageUrls') as string)
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

    const updatedMemory: Memory = {
        ...memory,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        date: formData.get('date') as string,
        imageUrls: imageUrls,
    };

    memories[memoryIndex] = updatedMemory;
    await saveMemories(memories);

    revalidatePath(`/memories/${memoryId}`);
    revalidatePath('/memories');
    redirect(`/memories/${memoryId}`);
}

export async function deleteMemoryAction(memoryId: number) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized.' };
    }

    const memories = await getMemories();
    const memory = memories.find(m => m.id === memoryId);
    if (!memory) {
        return { success: false, message: 'Memory not found.' };
    }

    if (sessionUser.role !== 'admin' && sessionUser.name !== memory.createdBy) {
        return { success: false, message: 'You are not authorized to delete this memory.' };
    }

    const updatedMemories = memories.filter(m => m.id !== memoryId);
    await saveMemories(updatedMemories);

    revalidatePath('/memories');
    redirect('/memories');
}

export async function addMemoryCommentAction(memoryId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized.' };
    }

    const text = formData.get('comment') as string;
    if (!text.trim()) {
        return { success: false, message: 'Comment cannot be empty.' };
    }

    const memories = await getMemories();
    const memory = memories.find(m => m.id === memoryId);
    if (!memory) {
        return { success: false, message: 'Memory not found.' };
    }

    memory.comments.push({
        id: Date.now(),
        author: sessionUser.name,
        text,
        timestamp: new Date().toISOString()
    });

    await saveMemories(memories);

    revalidatePath(`/memories/${memoryId}`);
    return { success: true, message: 'Comment added.' };
}

export async function deleteMemoryCommentAction(memoryId: number, commentId: number) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized.' };
    }

    const memories = await getMemories();
    const memory = memories.find(m => m.id === memoryId);
    if (!memory) {
        return { success: false, message: 'Memory not found.' };
    }

    const commentIndex = memory.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
        return { success: false, message: 'Comment not found.' };
    }

    const comment = memory.comments[commentIndex];
    const isAuthor = comment.author === sessionUser.name;
    const isAdmin = sessionUser.role === 'admin';

    if (!isAuthor && !isAdmin) {
        return { success: false, message: 'You are not authorized to delete this comment.' };
    }

    memory.comments.splice(commentIndex, 1);
    await saveMemories(memories);
    revalidatePath(`/memories/${memoryId}`);
    return { success: true, message: 'Comment deleted.' };
}
