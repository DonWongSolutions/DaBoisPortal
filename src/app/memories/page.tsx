
'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSessionAction, getMemoriesAction } from '@/app/actions';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { PlusCircle, CameraOff, ChevronsRight } from 'lucide-react';
import type { User, Memory } from '@/lib/types';
import { format } from 'date-fns';

function MemoryCard({ memory }: { memory: Memory }) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <AspectRatio ratio={16/9}>
                    {memory.imageUrls.length > 0 ? (
                        <Image 
                            src={memory.imageUrls[0]} 
                            alt={memory.title} 
                            fill 
                            className="rounded-md object-cover" 
                            data-ai-hint="memory photo"
                        />
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full bg-muted rounded-md">
                            <CameraOff className="h-10 w-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mt-2">No Image</p>
                        </div>
                    )}
                </AspectRatio>
            </CardHeader>
            <CardContent className="flex-grow">
                <CardTitle className="text-xl">{memory.title}</CardTitle>
                <CardDescription>{format(new Date(memory.date), 'MMMM d, yyyy')}</CardDescription>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{memory.description}</p>
            </CardContent>
            <CardFooter>
                <Button asChild variant="outline" className="w-full">
                    <Link href={`/memories/${memory.id}`}>
                        View Details <ChevronsRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function MemoriesPage() {
    const [user, setUser] = useState<User | null>(null);
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMemories = async () => {
        const fetchedMemories = await getMemoriesAction();
        setMemories(fetchedMemories);
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
                await fetchMemories();
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
        
        const interval = setInterval(fetchMemories, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full">Loading memories...</div>;
    }
    if (!user) {
        return <div>Redirecting...</div>
    }
    
    return (
        <AppShell user={user}>
            <PageHeader title="Memories" description="A shared space for cherished moments.">
                {user.role !== 'parent' && (
                    <Button asChild>
                        <Link href="/memories/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Memory
                        </Link>
                    </Button>
                )}
            </PageHeader>
            
             {memories.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {memories.map(memory => (
                        <MemoryCard key={memory.id} memory={memory} />
                    ))}
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">No Memories Yet</h3>
                    <p className="text-muted-foreground mb-4">
                       It's a bit quiet here. Be the first to add a memory!
                    </p>
                    {user.role !== 'parent' && (
                        <Button asChild>
                            <Link href="/memories/new">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Memory
                            </Link>
                        </Button>
                    )}
                </div>
            )}
        </AppShell>
    );
}
