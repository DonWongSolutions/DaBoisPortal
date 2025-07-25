
import { redirect } from 'next/navigation';
import { getWikiContent } from '@/lib/data';
import { getSession } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/app-shell';
import { Pencil } from 'lucide-react';

export default async function WikiPage({ params }: { params: { slug: string } }) {
    const user = await getSession();
    const pages = await getWikiContent();
    const page = pages.find(p => p.slug === params.slug);

    if (!page) {
        redirect('/wiki');
    }

    const content = (
        <>
            <PageHeader 
                title={page.title}
                description="A collaborative space for important information, editable by members."
            >
                 {user && (user.role === 'admin' || user.role === 'member') && (
                    <Button asChild variant="outline">
                        <Link href={`/wiki/${page.slug}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Page
                        </Link>
                    </Button>
                 )}
            </PageHeader>
            <Card>
                <CardContent className="p-6">
                    <div 
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                </CardContent>
            </Card>
        </>
    );

    if (user) {
        return (
            <AppShell user={user}>
                {content}
            </AppShell>
        );
    }
    
    return (
        <div className="bg-background text-foreground min-h-screen">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                <div className="flex items-center gap-2">
                    <Icons.Logo className="h-6 w-6 text-primary" />
                    <span className="text-lg font-semibold">
                        Da Bois Wiki
                    </span>
                </div>
                <div className="flex-1" />
                <Button asChild variant="outline">
                    <Link href="/login">Portal Login</Link>
                </Button>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {content}
            </main>
             <footer className="p-4 text-center text-sm text-muted-foreground border-t">
                Copyright Da Bois 2025. All Rights Reserved. Developed by Don Wong.
            </footer>
        </div>
    );
}

// Generate static paths for all wiki pages
export async function generateStaticParams() {
  const pages = await getWikiContent();
  return pages.map((page) => ({
    slug: page.slug,
  }));
}
