'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { getChatMessages, saveChatMessages } from '@/lib/data';
import type { ChatMessage } from '@/lib/types';

export async function getChatMessagesAction() {
    return await getChatMessages();
}

export async function sendChatMessageAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return;
    }

    const messageText = formData.get('message') as string;
    if (!messageText.trim()) {
        return;
    }
    
    const newMessage: ChatMessage = {
        id: Date.now(),
        author: sessionUser.name,
        text: messageText,
        timestamp: new Date().toISOString(),
    };

    const messages = await getChatMessages();
    messages.push(newMessage);
    await saveChatMessages(messages);

    revalidatePath('/chat');
}

export async function exportChatAction() {
    const messages = await getChatMessages();
    return messages.map(msg => `[${new Date(msg.timestamp).toLocaleString()}] ${msg.author}: ${msg.text}`).join('\n');
}

export async function clearChatAction() {
     const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }

    await saveChatMessages([]);
    revalidatePath('/chat');
    return { success: true, message: 'Chat history cleared successfully.' };
}
