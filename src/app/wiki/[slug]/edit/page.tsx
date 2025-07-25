
'use client';

import { redirect, useParams, useRouter } from 'next/navigation';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { getSessionAction, saveWikiPageAction, createWikiPageAction } from '@/app/actions';
import { getWikiContent as getWikiContentClient } from '@/lib/data.client';
import type { User, WikiPage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useActionState } from 'react';
import { PageHeader } from '@/components/page-header';
import { AppShell } from '@/components/app-shell';

const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null;
    }

    const addImage = () => {
        const url = window.prompt('Image URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }

    const toggleButtonClass = (isActive: boolean) => 
        cn("p-2 rounded-md", isActive ? 'bg-accent text-accent-foreground' : 'bg-transparent hover:bg-accent/50');
    
    return (
        <div className="flex flex-wrap items-center gap-1 border-b p-2 mb-4">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={toggleButtonClass(editor.isActive('bold'))}><Bold className="h-4 w-4" /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={toggleButtonClass(editor.isActive('italic'))}><Italic className="h-4 w-4" /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={toggleButtonClass(editor.isActive('strike'))}><Strikethrough className="h-4 w-4" /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={toggleButtonClass(editor.isActive('heading', { level: 1 }))}><Heading1 className="h-4 w-4" /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={toggleButtonClass(editor.isActive('heading', { level: 2 }))}><Heading2 className="h-4 w-4" /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={toggleButtonClass(editor.isActive('heading', { level: 3 }))}><Heading3 className="h-4 w-4" /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={toggleButtonClass(editor.isActive('bulletList'))}><List className="h-4 w-4" /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={toggleButtonClass(editor.isActive('orderedList'))}><ListOrdered className="h-4 w-4" /></button>
            <button type="button" onClick={addImage} className={toggleButtonClass(false)}><ImageIcon className="h-4 w-4" /></button>
        </div>
    );
};


export default function WikiEditSlugPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    
    const [user, setUser] = useState<User | null>(null);
    const [page, setPage] = useState<WikiPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [initialContent, setInitialContent] = useState('');
    const { toast } = useToast();

    const editor = useEditor({
        extensions: [StarterKit, Image],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[300px]',
            },
        },
    }, [initialContent]);

    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        if (!editor) return { success: false, message: "Editor not initialized." };
        formData.append('content', editor.getHTML());
        
        const result = await saveWikiPageAction(slug, formData);
        if (result.success) {
            toast({
                title: 'Success',
                description: result.message,
            });
             router.push(`/wiki/${slug}`);
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.message,
            });
        }
        return result;
    }, { success: false, message: '' });

    useEffect(() => {
        async function fetchData() {
            const sessionUser = await getSessionAction();
            const editableRoles: Array<User['role']> = ['admin', 'member'];
            if (!sessionUser || !editableRoles.includes(sessionUser.role) || sessionUser.name === 'Parents') {
                redirect('/wiki');
                return;
            }
            setUser(sessionUser);

            try {
                const wikiData = await getWikiContentClient();
                const currentWikiPage = wikiData.find(p => p.slug === slug);
                if (currentWikiPage) {
                    setPage(currentWikiPage);
                    setInitialContent(currentWikiPage.content);
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Failed to load wiki page content.',
                    });
                    redirect('/wiki');
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load wiki content.',
                });
                redirect('/wiki');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [slug, toast, router]);

    if (loading || !editor || !page || !user) {
        return <div>Loading Editor...</div>;
    }
    
    return (
      <AppShell user={user}>
        <form action={formAction}>
            <PageHeader 
                title={`Editing: ${page.title}`}
                description="Use the editor below to make changes."
            >
                <div className="flex gap-2">
                    <Button variant="outline" type="button" onClick={() => router.push(`/wiki/${slug}`)}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </div>
            </PageHeader>
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div>
                        <Label htmlFor="title">Page Title</Label>
                        <Input id="title" name="title" defaultValue={page.title} required />
                    </div>
                    <div>
                        <Label>Page Content</Label>
                        <div className="border rounded-md p-2">
                            <MenuBar editor={editor} />
                            <EditorContent editor={editor} />
                            </div>
                    </div>
                </CardContent>
            </Card>
        </form>
      </AppShell>
    )
}
