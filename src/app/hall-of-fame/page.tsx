
'use client';

import { useEffect, useState, useActionState, useRef } from 'react';
import { redirect } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSessionAction, getWiseWords, createWiseWordAction, deleteWiseWordAction, upvoteWiseWordAction, pinWiseWordAction } from '@/app/actions';
import { getUsers } from '@/lib/data.client';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { User, WiseWord } from '@/lib/types';
import { PlusCircle, Quote, Trash2, ThumbsUp, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

function WiseWordDialog({ users, children }: { users: User[], children: React.ReactNode }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await createWiseWordAction(formData);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            setOpen(false);
            formRef.current?.reset();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        return result;
    }, { success: false, message: '' });

    const { pending } = useFormStatus();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form action={formAction} ref={formRef}>
                    <DialogHeader>
                        <DialogTitle>Immortalize a Wise Word</DialogTitle>
                        <DialogDescription>
                            Add a new phrase to the hall of fame.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phrase">The Phrase</Label>
                            <Textarea id="phrase" name="phrase" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="author">Who Said It?</Label>
                             <Select name="author" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select the author" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(user => (
                                        <SelectItem key={user.name} value={user.name}>{user.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="context">Context / Date (Optional)</Label>
                            <Input id="context" name="context" placeholder="e.g. On a trip to Shenzhen" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={pending}>
                            {pending ? 'Immortalizing...' : 'Add to Hall of Fame'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function WiseWordCard({ wiseWord, user, canDelete, onVote, onDelete, onPin, rank }: { wiseWord: WiseWord, user: User, canDelete: boolean, onVote: (id: number) => void, onDelete: (id: number) => void, onPin: (id: number) => void, rank?: number }) {
    const hasVoted = wiseWord.upvotes.includes(user.id);

    const rankClasses = [
        "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700", // Gold
        "bg-slate-200 dark:bg-slate-700/30 border-slate-300 dark:border-slate-600", // Silver
        "bg-orange-200 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700" // Bronze
    ];

    return (
        <Card className={cn("relative flex flex-col", rank && rank <= 3 && rankClasses[rank-1])}>
            <CardContent className="pt-6 flex-grow">
                <blockquote className="space-y-2">
                    <p className="text-lg font-semibold italic">"{wiseWord.phrase}"</p>
                    <footer className="text-sm text-muted-foreground">
                        ~ Wise words from {wiseWord.author}{wiseWord.context ? `, ${wiseWord.context}`: ''}
                    </footer>
                </blockquote>
            </CardContent>
            <Separator />
            <div className="p-4 flex justify-between items-center">
                 <Button variant={hasVoted ? "default" : "outline"} size="sm" onClick={() => onVote(wiseWord.id)}>
                    <ThumbsUp className="mr-2 h-4 w-4" /> {wiseWord.upvotes.length}
                 </Button>
                 {canDelete && (
                     <div className="flex gap-2">
                         <Button variant="ghost" size="sm" onClick={() => onPin(wiseWord.id)}>
                            <Pin className={cn("mr-2 h-4 w-4", wiseWord.pinned && "fill-primary text-primary")} /> Pin
                         </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this wise word.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(wiseWord.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>
        </Card>
    )
}

function PinnedBanner({ wiseWord }: { wiseWord: WiseWord }) {
    return (
        <Card className="mb-8 border-primary border-2">
             <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-primary"><Pin className="h-5 w-5 fill-primary" /> Pinned Quote</CardTitle>
            </CardHeader>
            <CardContent>
                 <blockquote className="space-y-2">
                    <p className="text-2xl font-semibold italic">"{wiseWord.phrase}"</p>
                    <footer className="text-md text-muted-foreground">
                        ~ Wise words from {wiseWord.author}{wiseWord.context ? `, ${wiseWord.context}`: ''}
                    </footer>
                </blockquote>
            </CardContent>
        </Card>
    )
}

export default function HallOfFamePage() {
    const [user, setUser] = useState<User | null>(null);
    const [members, setMembers] = useState<User[]>([]);
    const [wiseWords, setWiseWords] = useState<WiseWord[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchWisdom = async () => {
        const fetchedWords = await getWiseWords();
        setWiseWords(fetchedWords);
    };

    useEffect(() => {
        async function fetchData() {
            try {
                const sessionUser = await getSessionAction();
                if (!sessionUser) {
                    redirect('/login');
                    return;
                }
                setUser(sessionUser);
                const allUsers = await getUsers();
                setMembers(allUsers.filter(u => u.role !== 'parent'))
                await fetchWisdom();
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);
    
    // Poll for updates
    useEffect(() => {
        const interval = setInterval(fetchWisdom, 2000); 
        return () => clearInterval(interval);
    }, []);

     const handleDelete = async (id: number) => {
        const result = await deleteWiseWordAction(id);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
        } else {
             toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };
    
     const handleVote = async (id: number) => {
        const result = await upvoteWiseWordAction(id);
        if (!result.success) {
             toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };

     const handlePin = async (id: number) => {
        const result = await pinWiseWordAction(id);
        if (!result.success) {
             toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };


    if (loading) {
        return <div className="flex justify-center items-center h-full">Loading...</div>;
    }
    if (!user) {
        return <div>Redirecting...</div>
    }
    
    const sortedWiseWords = [...wiseWords].sort((a, b) => b.upvotes.length - a.upvotes.length);
    const pinnedWord = wiseWords.find(ww => ww.pinned);
    
    return (
        <AppShell user={user}>
            <PageHeader title="Hall of Wise Words" description="A collection of memorable phrases and inside jokes.">
                {user.role !== 'parent' && (
                    <WiseWordDialog users={members}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add a Wise Word
                        </Button>
                    </WiseWordDialog>
                )}
            </PageHeader>
            
            {pinnedWord && <PinnedBanner wiseWord={pinnedWord} />}
            
            {sortedWiseWords.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sortedWiseWords.map((word, index) => (
                        <WiseWordCard 
                            key={word.id} 
                            wiseWord={word} 
                            user={user}
                            canDelete={user.role === 'admin'} 
                            onVote={handleVote}
                            onDelete={handleDelete}
                            onPin={handlePin}
                            rank={index + 1}
                        />
                    ))}
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <Quote className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="text-2xl font-bold tracking-tight mt-4">The Hall is Empty</h3>
                    <p className="text-muted-foreground mb-4">
                       Be the first to immortalize some wise words.
                    </p>
                    {user.role !== 'parent' && (
                         <WiseWordDialog users={members}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add a Wise Word
                            </Button>
                        </WiseWordDialog>
                    )}
                </div>
            )}
        </AppShell>
    );
}
