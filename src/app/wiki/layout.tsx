
import Link from 'next/link';
import { getWikiContent } from '@/lib/data';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/app-shell';
import { FilePenLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

async function WikiSidebarNav() {
    const pages = await getWikiContent();
    const user = await getSession();
    const canEdit = user && ['admin', 'member'].includes(user.role);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Wiki Pages</CardTitle>
                 {canEdit && (
                    <Button asChild size="sm">
                        <Link href="/wiki/new">
                            <FilePenLine className="mr-2 h-4 w-4" />
                            New
                        </Link>
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <nav className="flex flex-col gap-2">
                    {pages.map(page => (
                        <Link
                            key={page.slug}
                            href={`/wiki/${page.slug}`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {page.title}
                        </Link>
                    ))}
                </nav>
            </CardContent>
        </Card>
    );
}


export default async function WikiLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const user = await getSession();

    if (user) {
        return (
            <AppShell user={user}>
                <div className="grid md:grid-cols-4 gap-8">
                    <aside className="md:col-span-1">
                       <WikiSidebarNav />
                    </aside>
                    <div className="md:col-span-3">
                        {children}
                    </div>
                </div>
            </AppShell>
        );
    }
    
    // Public Layout
    return (
       <div className="bg-background text-foreground min-h-screen">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                <div className="flex items-center gap-2">
                    <Icons.Logo className="h-6 w-6 text-primary" />
                     <Link href="/wiki" className="text-lg font-semibold">
                        Da Bois Wiki
                    </Link>
                </div>
                <div className="flex-1" />
                <Button asChild variant="outline">
                    <Link href="/login">Portal Login</Link>
                </Button>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                 <div className="grid md:grid-cols-4 gap-8">
                    <aside className="md:col-span-1">
                       <WikiSidebarNav />
                    </aside>
                    <div className="md:col-span-3">
                        {children}
                    </div>
                </div>
            </main>
             <footer className="p-4 text-center text-sm text-muted-foreground border-t">
                Copyright Da Bois 2025. All Rights Reserved. Developed by Don Wong.
            </footer>
        </div>
    );
}
