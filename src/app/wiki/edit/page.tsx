
'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { getSessionAction, saveWikiContentAction } from '@/app/actions';
import { getWikiContent } from '@/lib/data.client';
import type { User } from '@/lib/types';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3, Pilcrow, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={toggleButtonClass(editor.isActive('bold'))}><Bold className="h-4 w-4" /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={toggleButtonClass(editor.isActive('italic'))}><Italic className="h-4 w-4" /></button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} className={toggleButtonClass(editor.isActive('strike'))}><Strikethrough className="h-4 w-4" /></button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={toggleButtonClass(editor.isActive('heading', { level: 1 }))}><Heading1 className="h-4 w-4" /></button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={toggleButtonClass(editor.isActive('heading', { level: 2 }))}><Heading2 className="h-4 w-4" /></button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={toggleButtonClass(editor.isActive('heading', { level: 3 }))}><Heading3 className="h-4 w-4" /></button>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={toggleButtonClass(editor.isActive('bulletList'))}><List className="h-4 w-4" /></button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={toggleButtonClass(editor.isActive('orderedList'))}><ListOrdered className="h-4 w-4" /></button>
            <button onClick={addImage} className={toggleButtonClass(false)}><ImageIcon className="h-4 w-4" /></button>
        </div>
    );
};


export default function WikiEditPage() {
    const [user, setUser] = useState<User | null>(null);
    const [initialContent, setInitialContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        async function fetchData() {
            try {
                const sessionUser = await getSessionAction();
                const editableRoles: Array<User['role']> = ['admin', 'member'];
                if (!sessionUser || !editableRoles.includes(sessionUser.role) || sessionUser.name === 'Parents') {
                    redirect('/wiki');
                    return;
                }
                setUser(sessionUser);

                const wikiData = await getWikiContent();
                setInitialContent(wikiData.content);
                editor?.commands.setContent(wikiData.content);

            } catch (error) {
                console.error("Failed to fetch data:", error);
                redirect('/dashboard');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [editor]);
    
    const handleSave = async () => {
        if (!editor) return;
        const html = editor.getHTML();
        const result = await saveWikiContentAction(html);
        if (result.success) {
            toast({
                title: 'Success',
                description: result.message,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.message,
            });
        }
    };


    if (loading || !editor) {
        return <div>Loading Editor...</div>;
    }
    
    if (!user) {
        return <div>Redirecting...</div>
    }

    return (
        <AppShell user={user}>
            <PageHeader 
                title="Edit Wiki"
                description="Use the editor below to make changes to the public wiki."
            >
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => redirect('/wiki')}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </PageHeader>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Card>
                        <CardContent className="p-4">
                            <MenuBar editor={editor} />
                            <EditorContent editor={editor} />
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle>Formatting Help</CardTitle>
                            <CardDescription>Use markdown shortcuts for quick formatting.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>Headings</AccordionTrigger>
                                    <AccordionContent>
                                        <code># H1</code>, <code>## H2</code>, <code>### H3</code>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger>Text Styles</AccordionTrigger>
                                    <AccordionContent>
                                        <code>**Bold**</code> or <code>__Bold__</code><br/>
                                        <code>*Italic*</code> or <code>_Italic_</code><br/>
                                        <code>~~Strike~~</code>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger>Lists</AccordionTrigger>
                                    <AccordionContent>
                                        Unordered: <code>* </code>, <code>- </code>, or <code>+ </code><br/>
                                        Ordered: <code>1. </code>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                     </Card>
                </div>
            </div>
        </AppShell>
    )
}
