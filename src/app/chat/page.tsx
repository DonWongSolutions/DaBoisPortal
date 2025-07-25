
'use client';

import { useEffect, useState, useRef } from 'react';
import { redirect } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSessionAction, getChatMessagesAction, sendChatMessageAction, exportChatAction, clearChatAction } from '@/app/actions';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Download, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
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

function ChatAdminButtons() {
    const { toast } = useToast();

    const handleExport = async () => {
        const chatContent = await exportChatAction();
        const blob = new Blob([chatContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dabois-chat-export.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClear = async () => {
        const result = await clearChatAction();
        if (result.success) {
            toast({
                title: "Success",
                description: result.message,
            });
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.message,
            });
        }
    };
    
    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Chat
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Chat
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the entire chat history for everyone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClear}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}


export default function ChatPage() {
    const [user, setUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const formRef = useRef<HTMLFormElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        viewportRef.current?.scrollTo(0, viewportRef.current.scrollHeight);
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
            <PageHeader title="Secure Chat" description="Real-time chat for members.">
                {user.role === 'admin' && <ChatAdminButtons />}
            </PageHeader>
            <div className="flex flex-col h-[calc(100vh-250px)]">
                 <Card className="flex-1 flex flex-col">
                    <CardContent className="flex-1 p-6 flex flex-col">
                       <ScrollArea className="flex-1 h-full" ref={viewportRef}>
                            <div className="space-y-4 pr-4">
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
                            </div>
                       </ScrollArea>
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
