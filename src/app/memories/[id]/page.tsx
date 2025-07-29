
'use client';

import { useEffect, useState, useActionState, useRef } from 'react';
import { redirect, useParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { getSessionAction, getMemoryByIdAction, addMemoryCommentAction, deleteMemoryAction, deleteMemoryCommentAction } from '@/app/actions';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { User, Memory, MemoryComment } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { Calendar, User as UserIcon, Send, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

function CommentForm({ memoryId }: { memoryId: number }) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await addMemoryCommentAction(memoryId, formData);
        if (result.success) {
            formRef.current?.reset();
        } else {
             toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        return result;
    }, { success: false, message: ''});
    
    const { pending } = useFormStatus();

    return (
        <form action={formAction} ref={formRef} className="flex gap-2 items-start">
            <Textarea name="comment" placeholder="Write a comment..." required className="flex-grow" />
            <Button type="submit" disabled={pending} size="icon">
                <Send className="h-5 w-5" />
            </Button>
        </form>
    );
}

function ImageCarousel({ images }: { images: string[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    if (images.length === 0) return null;

    return (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
            <Image
                src={images[currentIndex]}
                alt={`Memory image ${currentIndex + 1}`}
                fill
                className="object-contain"
                data-ai-hint="memory photo"
            />
            {images.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPrevious}
                        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronLeft />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNext}
                        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronRight />
                    </Button>
                     <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs rounded-full px-2 py-1">
                        {currentIndex + 1} / {images.length}
                    </div>
                </>
            )}
        </div>
    );
}


export default function MemoryDetailPage() {
    const params = useParams();
    const memoryId = Number(params.id);
    const [user, setUser] = useState<User | null>(null);
    const [memory, setMemory] = useState<Memory | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchMemory = async () => {
        try {
            const fetchedMemory = await getMemoryByIdAction(memoryId);
            if (!fetchedMemory) {
                redirect('/memories');
                return;
            }
            setMemory(fetchedMemory);
        } catch (error) {
            console.error("Failed to fetch memory:", error);
        }
    }

    const handleDeleteComment = async (commentId: number) => {
        const result = await deleteMemoryCommentAction(memoryId, commentId);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            fetchMemory();
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const sessionUser = await getSessionAction();
                if (!sessionUser) {
                    redirect('/login');
                    return;
                }
                setUser(sessionUser);
                await fetchMemory();
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
        
        const interval = setInterval(fetchMemory, 2000);
        return () => clearInterval(interval);

    }, [memoryId]);

    if (loading || !memory || !user) {
        return <div className="flex justify-center items-center h-full">Loading memory...</div>;
    }

    const canEdit = user.role === 'admin' || user.name === memory.createdBy;

    return (
        <AppShell user={user}>
            <PageHeader
                title={memory.title}
                description={
                    <div className="flex items-center gap-4 text-muted-foreground text-base mt-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(memory.date), 'MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Created by {memory.createdBy}</span>
                        </div>
                    </div>
                }
            >
                {canEdit && (
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={`/memories/${memory.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <form action={deleteMemoryAction.bind(null, memory.id)}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete this memory. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction asChild>
                                            <Button type="submit">Yes, delete it</Button>
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </form>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </PageHeader>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <ImageCarousel images={memory.imageUrls} />
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{memory.description}</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Comments ({memory.comments.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <CommentForm memoryId={memory.id} />
                            <Separator />
                            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                                {memory.comments.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(comment => {
                                    const canDeleteComment = user.role === 'admin' || user.name === comment.author;
                                    return (
                                        <div key={comment.id} className="flex gap-3 group">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-sm">{comment.author}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                                                        </span>
                                                        {canDeleteComment && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100">
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This will permanently delete this comment. This action cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{comment.text}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                                {memory.comments.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to say something!</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppShell>
    );
}
