

import { getWikiContent } from '@/lib/data';
import { getSession } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FilePenLine } from 'lucide-react';

export default async function WikiDirectoryPage() {
    const user = await getSession();
    const pages = await getWikiContent();
    const canEdit = user && (user.role === 'admin' || user.role === 'member');

    return (
        <>
            <PageHeader 
                title="Wiki"
                description="A collaborative space for important information."
            >
                {canEdit && (
                    <Button asChild>
                        <Link href="/wiki/new">
                            <FilePenLine className="mr-2 h-4 w-4" />
                            New Page
                        </Link>
                    </Button>
                )}
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle>All Pages</CardTitle>
                    <CardDescription>Browse the available wiki pages.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pages.map(page => (
                            <Link href={`/wiki/${page.slug}`} key={page.slug} legacyBehavior>
                                <a className="block p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
                                    <h3 className="font-semibold">{page.title}</h3>
                                </a>
                            </Link>
                        ))}
                        {pages.length === 0 && (
                            <p className="text-muted-foreground">No wiki pages have been created yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
