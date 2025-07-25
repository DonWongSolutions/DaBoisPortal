
import { redirect } from 'next/navigation';
import { getWikiContent } from '@/lib/data';
import { getSession } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export default async function WikiPage({ params }: { params: { slug: string } }) {
    const user = await getSession();
    const pages = await getWikiContent();
    const page = pages.find(p => p.slug === params.slug);

    if (!page) {
        redirect('/wiki');
    }

    const canEdit = user && (user.role === 'admin' || user.role === 'member');

    return (
        <>
            <PageHeader 
                title={page.title}
            >
                 {canEdit && (
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
}

// Generate static paths for all wiki pages
export async function generateStaticParams() {
  const pages = await getWikiContent();
  return pages.map((page) => ({
    slug: page.slug,
  }));
}
