
'use client';

import { useEffect, useState, useRef } from 'react';
import { redirect } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSessionAction, getChatMessagesAction, sendChatMessageAction } from '@/app/actions';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import type { User, ChatMessage } from '@/lib/types';
import { format } from 'date-fns';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="icon" disabled={pending}>
            <Send className="h-5 w-5" />
        </Button>
    )
}

export default function ChatPage() {
    const [user, setUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const formRef = useRef<HTMLFormElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        const fetchedMessages = await getChatMessagesAction();
        setMessages(fetchedMessages);
    };

    useEffect(() => {
        async function fetchSession() {
            try {
                const sessionUser = await getSessionAction();
                if (!sessionUser || sessionUser.role === 'parent') {
                    redirect('/dashboard');
                } else {
                    setUser(sessionUser);
                    await fetchMessages();
                }
            } catch (error) {
                console.error("Failed to fetch session:", error);
                redirect('/login');
            } finally {
                setLoading(false);
            }
        }
        fetchSession();

        const interval = setInterval(fetchMessages, 3000); // Poll for new messages every 3 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    if (loading) {
        return <div className="flex justify-center items-center h-full">Loading chat...</div>;
    }

    if (!user) {
        return <div>Redirecting...</div>
    }

    return (
        <AppShell user={user}>
            <PageHeader title="Secure Chat" description="Real-time chat for members." />
            <div className="flex flex-col h-[calc(100vh-200px)]">
                 <Card className="flex-1 flex flex-col">
                    <CardContent className="flex-1 p-6 space-y-4 overflow-y-auto">
                        {messages.map(msg => (
                             <div key={msg.id} className={`flex items-start gap-3 ${msg.author === user.name ? 'justify-end' : ''}`}>
                                {msg.author !== user.name && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={''} data-ai-hint="user avatar" />
                                        <AvatarFallback>{msg.author.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`flex flex-col ${msg.author === user.name ? 'items-end' : 'items-start'}`}>
                                    <div className={`rounded-lg px-4 py-2 max-w-sm ${msg.author === user.name ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                       <p className="text-sm">{msg.text}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-1">
                                       {msg.author}, {format(new Date(msg.timestamp), "p")}
                                    </span>
                                </div>
                                 {msg.author === user.name && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.profilePictureUrl} data-ai-hint="user avatar" />
                                        <AvatarFallback>{msg.author.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </CardContent>
                    <CardFooter className="p-4 border-t">
                        <form 
                            ref={formRef}
                            action={async (formData) => {
                                await sendChatMessageAction(formData);
                                formRef.current?.reset();
                            }} 
                            className="flex w-full items-center gap-2"
                        >
                            <Input name="message" placeholder="Type your message..." autoComplete="off" />
                            <SubmitButton />
                        </form>
                    </CardFooter>
                 </Card>
            </div>
        </AppShell>
    );
}
