
'use client';

import { useEffect, useState, useActionState, useRef } from 'react';
import { redirect } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSessionAction, createLinkAction, rateLinkAction, getLinksAction, updateLinkAction, deleteLinkAction } from '@/app/actions';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { User, Link as LinkType } from '@/lib/types';
import { PlusCircle, Star, ExternalLink, Tag, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

function LinkDialog({ mode = 'add', link, children, onUpdate }: { mode?: 'add' | 'edit', link?: LinkType, children: React.ReactNode, onUpdate: () => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const action = mode === 'add' ? createLinkAction : updateLinkAction.bind(null, link!.id);

    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await action(formData);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            setOpen(false);
            formRef.current?.reset();
            onUpdate();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        return result;
    }, { success: false, message: ''});
    const { pending } = useFormStatus();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form action={formAction} ref={formRef}>
                    <DialogHeader>
                        <DialogTitle>{mode === 'add' ? 'Add a New Link' : 'Edit Link'}</DialogTitle>
                        <DialogDescription>
                            {mode === 'add' ? 'Share a useful link with the group.' : 'Update the details for this link.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" defaultValue={link?.title} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input id="url" name="url" type="url" placeholder="https://example.com" defaultValue={link?.url} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" defaultValue={link?.description} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags</Label>
                             <Input id="tags" name="tags" placeholder="e.g. food, planning, travel" defaultValue={link?.tags?.join(', ')} />
                             <p className="text-xs text-muted-foreground">Enter tags separated by commas.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={pending}>
                            {pending ? (mode === 'add' ? 'Adding...' : 'Saving...') : (mode === 'add' ? 'Add Link' : 'Save Changes')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function StarRating({ link, currentRating, onRate }: { link: LinkType, currentRating: number, onRate: (linkId: number, rating: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => onRate(link.id, star)}>
                    <Star
                        className={`h-5 w-5 cursor-pointer ${
                            star <= currentRating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-muted-foreground'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

function LinkCard({ link, user, onRate, onDelete, onUpdate }: { link: LinkType, user: User, onRate: (linkId: number, rating: number) => void, onDelete: (linkId: number) => void, onUpdate: () => void }) {

    const totalRating = link.ratings.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = link.ratings.length > 0 ? totalRating / link.ratings.length : 0;
    const userRating = link.ratings.find(r => r.userId === user.id)?.rating || 0;
    const canEdit = user.role === 'admin' || user.name === link.createdBy;

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start gap-4">
                    <CardTitle className="break-words">{link.title}</CardTitle>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex-shrink-0">
                        <ExternalLink className="h-5 w-5" />
                    </a>
                </div>
                <CardDescription>Added by {link.createdBy} on {new Date(link.createdAt).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-4">{link.description}</p>
                {link.tags && link.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {link.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>
                )}
            </CardContent>
             <Separator />
            <CardFooter className="flex justify-between items-center pt-4">
                <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span className="font-bold">{averageRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({link.ratings.length})</span>
                </div>
                <StarRating link={link} currentRating={userRating} onRate={onRate} />
            </CardFooter>
            {canEdit && (
                <>
                <Separator />
                <CardFooter className="pt-4 justify-end gap-2">
                     <LinkDialog mode="edit" link={link} onUpdate={onUpdate}>
                         <Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
                     </LinkDialog>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this link.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(link.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
                </>
            )}
        </Card>
    );
}

export default function LinkBoardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [links, setLinks] = useState<LinkType[]>([]);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchLinks = async () => {
        const fetchedLinks = await getLinksAction();
        setLinks(fetchedLinks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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
                await fetchLinks();
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);
    
    const handleRate = async (linkId: number, rating: number) => {
        const result = await rateLinkAction(linkId, rating);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            await fetchLinks();
        } else {
             toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };
    
    const handleDelete = async (linkId: number) => {
        const result = await deleteLinkAction(linkId);
         if (result.success) {
            toast({ title: 'Success', description: result.message });
            await fetchLinks();
        } else {
             toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };

    const allTags = Array.from(new Set(links.flatMap(link => link.tags || [])));

    const filteredLinks = activeTag ? links.filter(link => link.tags?.includes(activeTag)) : links;

    if (loading) {
        return <div className="flex justify-center items-center h-full">Loading links...</div>;
    }
    if (!user) {
        return <div>Redirecting...</div>
    }

    return (
        <AppShell user={user}>
            <PageHeader title="Link Board" description="A shared space for interesting links.">
                 <LinkDialog onUpdate={fetchLinks}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Link
                    </Button>
                </LinkDialog>
            </PageHeader>

            {allTags.length > 0 && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><Tag className="h-5 w-5" /> Filter by Tag</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        <Button variant={!activeTag ? 'default' : 'outline'} onClick={() => setActiveTag(null)}>
                            Show All
                        </Button>
                        {allTags.map(tag => (
                            <Button key={tag} variant={activeTag === tag ? 'default' : 'outline'} onClick={() => setActiveTag(tag)}>
                                {tag}
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            )}

            {filteredLinks.length > 0 ? (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredLinks.map(link => (
                        <LinkCard key={link.id} link={link} user={user} onRate={handleRate} onDelete={handleDelete} onUpdate={fetchLinks} />
                    ))}
                 </div>
            ) : (
                 <div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">No links found</h3>
                    <p className="text-muted-foreground mb-4">
                       {activeTag ? `No links found with the tag "${activeTag}".` : 'Get started by adding a new link.'}
                    </p>
                 </div>
            )}
        </AppShell>
    );
}
