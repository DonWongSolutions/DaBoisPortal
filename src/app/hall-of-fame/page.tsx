
'use client';

import { useEffect, useState, useActionState, useRef } from 'react';
import { redirect } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSessionAction, getWiseWords, createWiseWordAction, deleteWiseWordAction } from '@/app/actions';
import { getUsers } from '@/lib/data.client';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { User, WiseWord } from '@/lib/types';
import { PlusCircle, Quote, Trash2 } from 'lucide-react';

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

function WiseWordCard({ wiseWord, canDelete, onDelete }: { wiseWord: WiseWord, canDelete: boolean, onDelete: (id: number) => void }) {
    return (
        <Card className="relative">
            <CardContent className="pt-6">
                <blockquote className="space-y-2">
                    <p className="text-lg font-semibold italic">"{wiseWord.phrase}"</p>
                    <footer className="text-sm text-muted-foreground">
                        ~ Wise words from {wiseWord.author}{wiseWord.context ? `, ${wiseWord.context}`: ''}
                    </footer>
                </blockquote>
            </CardContent>
             {canDelete && (
                <div className="absolute top-4 right-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
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
        setWiseWords(fetchedWords.sort((a,b) => b.id - a.id));
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
        const interval = setInterval(fetchWisdom, 2000); // Poll for updates
        return () => clearInterval(interval);
    }, []);

     const handleDelete = async (id: number) => {
        const result = await deleteWiseWordAction(id);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            await fetchWisdom();
        } else {
             toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };


    if (loading) {
        return <div className="flex justify-center items-center h-full">Loading...</div>;
    }
    if (!user) {
        return <div>Redirecting...</div>
    }
    
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
            
            {wiseWords.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {wiseWords.map(word => (
                        <WiseWordCard key={word.id} wiseWord={word} canDelete={user.role === 'admin'} onDelete={handleDelete} />
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
