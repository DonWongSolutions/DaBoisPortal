
'use client';

import { useEffect, useState, useActionState, useRef } from 'react';
import { redirect } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSessionAction, getWiseWords, createWiseWordAction, deleteWiseWordAction, upvoteWiseWordAction, pinWiseWordAction, updateWiseWordCategoryAction } from '@/app/actions';
import { getUsers } from '@/lib/data.client';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { User, WiseWord, WiseWordCategory } from '@/lib/types';
import { PlusCircle, Quote, Trash2, ThumbsUp, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function WiseWordDialog({ users, children, onUpdate }: { users: User[], children: React.ReactNode, onUpdate: () => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await createWiseWordAction(formData);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            setOpen(false);
            formRef.current?.reset();
            onUpdate();
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

const categoryColors: Record<WiseWordCategory, string> = {
    "Exotic": "border-amber-400 bg-amber-50 dark:bg-amber-950",
    "Legendary": "border-violet-400 bg-violet-50 dark:bg-violet-950",
    "Common": "border-gray-300 dark:border-gray-700",
}

const podiumColors = [
    "border-yellow-400 bg-yellow-100 dark:bg-yellow-950", // Gold
    "border-gray-400 bg-gray-100 dark:bg-gray-800", // Silver
    "border-orange-400 bg-orange-100 dark:bg-orange-950", // Bronze
]

function WiseWordCard({ wiseWord, user, onVote, onDelete, onPin, onCategoryChange, podiumPlace }: { wiseWord: WiseWord, user: User, onVote: (id: number) => void, onDelete: (id: number) => void, onPin: (id: number) => void, onCategoryChange: (id: number, category: WiseWordCategory) => void, podiumPlace?: number }) {
    const hasVoted = wiseWord.upvotes.includes(user.id);
    const canManage = user.role !== 'parent';
    const canDelete = user.role === 'admin';

    const cardClass = podiumPlace !== undefined && podiumPlace < 3 
        ? podiumColors[podiumPlace]
        : categoryColors[wiseWord.category];

    return (
        <Card className={cn("relative flex flex-col transition-all border-2", cardClass)}>
            <CardContent className="pt-6 flex-grow">
                <blockquote className="space-y-2">
                    <p className="text-lg font-semibold italic">"{wiseWord.phrase}"</p>
                    <footer className="text-sm text-muted-foreground">
                        ~ Wise words from {wiseWord.author}{wiseWord.context ? `, ${wiseWord.context}`: ''}
                    </footer>
                </blockquote>
            </CardContent>
            <Separator />
            <div className="p-4 flex justify-between items-center gap-2">
                 <Button variant={hasVoted ? "default" : "outline"} size="sm" onClick={() => onVote(wiseWord.id)} disabled={!canManage}>
                    <ThumbsUp className="mr-2 h-4 w-4" /> {wiseWord.upvotes.length}
                 </Button>
                 <div className="flex gap-2 items-center">
                    <Select 
                        defaultValue={wiseWord.category}
                        onValueChange={(value) => onCategoryChange(wiseWord.id, value as WiseWordCategory)}
                        disabled={!canManage}
                    >
                        <SelectTrigger className="text-xs h-9 w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Common">Common</SelectItem>
                            <SelectItem value="Legendary">Legendary</SelectItem>
                            <SelectItem value="Exotic">Exotic</SelectItem>
                        </SelectContent>
                    </Select>
                    {canDelete && (
                        <>
                         <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onPin(wiseWord.id)}>
                            <Pin className={cn("h-4 w-4", wiseWord.pinned && "fill-primary text-primary")} />
                         </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 h-9 w-9">
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
                        </>
                    )}
                </div>
            </div>
        </Card>
    )
}

export default function HallOfFamePage() {
    const [user, setUser] = useState<User | null>(null);
    const [members, setMembers] = useState<User[]>([]);
    const [wiseWords, setWiseWords] = useState<WiseWord[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<WiseWordCategory | 'All'>('All');

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

     const handleDelete = async (id: number) => {
        const result = await deleteWiseWordAction(id);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            fetchWisdom();
        } else {
             toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };
    
     const handleVote = async (id: number) => {
        const result = await upvoteWiseWordAction(id);
        if (!result.success) {
             toast({ variant: 'destructive', title: 'Error', description: result.message });
        } else {
            fetchWisdom();
        }
    };

     const handlePin = async (id: number) => {
        const result = await pinWiseWordAction(id);
        if (!result.success) {
             toast({ variant: 'destructive', title: 'Error', description: result.message });
        } else {
            fetchWisdom();
        }
    };

    const handleCategoryChange = async (id: number, category: WiseWordCategory) => {
        const result = await updateWiseWordCategoryAction(id, category);
        if (!result.success) {
             toast({ variant: 'destructive', title: 'Error', description: result.message });
        } else {
            fetchWisdom();
        }
    }


    if (loading) {
        return <div className="flex justify-center items-center h-full">Loading...</div>;
    }
    if (!user) {
        return <div>Redirecting...</div>
    }
    
    const sortedWiseWords = [...wiseWords].sort((a, b) => {
        if (b.upvotes.length !== a.upvotes.length) {
            return b.upvotes.length - a.upvotes.length;
        }
        const categoryOrder = { Exotic: 0, Legendary: 1, Common: 2 };
        return categoryOrder[a.category] - categoryOrder[b.category];
    });

    const filteredWords = activeTab === 'All'
        ? sortedWiseWords
        : sortedWiseWords.filter(word => word.category === activeTab);
    
    return (
        <AppShell user={user}>
            <PageHeader title="Hall of Wise Words" description="A collection of memorable phrases and inside jokes.">
                {user.role !== 'parent' && (
                    <WiseWordDialog users={members} onUpdate={fetchWisdom}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add a Wise Word
                        </Button>
                    </WiseWordDialog>
                )}
            </PageHeader>
            
            <Tabs defaultValue="All" onValueChange={(value) => setActiveTab(value as any)} className="mb-4">
                <TabsList>
                    <TabsTrigger value="All">All</TabsTrigger>
                    <TabsTrigger value="Exotic">Exotic</TabsTrigger>
                    <TabsTrigger value="Legendary">Legendary</TabsTrigger>
                    <TabsTrigger value="Common">Common</TabsTrigger>
                </TabsList>
            </Tabs>
            
            {filteredWords.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredWords.map((word, index) => (
                        <WiseWordCard 
                            key={word.id} 
                            wiseWord={word} 
                            user={user}
                            onVote={handleVote}
                            onDelete={handleDelete}
                            onPin={handlePin}
                            onCategoryChange={handleCategoryChange}
                            podiumPlace={activeTab === 'All' ? index : undefined}
                        />
                    ))}
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <Quote className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="text-2xl font-bold tracking-tight mt-4">No wise words found for this category.</h3>
                     <p className="text-muted-foreground mb-4">
                       Try a different filter or add a new wise word!
                    </p>
                    {user.role !== 'parent' && (
                         <WiseWordDialog users={members} onUpdate={fetchWisdom}>
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
