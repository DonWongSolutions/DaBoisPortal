
import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: React.ReactNode;
}

export function PageHeader({ title, description, className, children, ...props }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8", className)} {...props}>
            <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
                    {title}
                </h1>
                {description && (
                    <div className="mt-2 text-lg text-muted-foreground">
                        {description}
                    </div>
                )}
            </div>
            {children && <div className="flex-shrink-0">{children}</div>}
        </div>
    );
}
