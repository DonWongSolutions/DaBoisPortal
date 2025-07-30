
'use client';

import { useState, useEffect } from 'react';
import type { WiseWord } from '@/lib/types';
import { cn } from '@/lib/utils';

export function PinnedQuotesClient({ quotes }: { quotes: WiseWord[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [countdown, setCountdown] = useState(10);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        if (quotes.length <= 1) return;

        const countdownInterval = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [quotes.length]);

    useEffect(() => {
        if (countdown === 0) {
            setIsFading(true);
            setTimeout(() => {
                setCurrentIndex(prevIndex => (prevIndex + 1) % quotes.length);
                setCountdown(10);
                setIsFading(false);
            }, 500); // Wait for fade out animation to complete
        }
    }, [countdown, quotes.length]);
    
    if (quotes.length === 0) {
        return null;
    }

    const currentQuote = quotes[currentIndex];

    return (
         <div className="absolute bottom-8 right-8 text-white p-6 rounded-lg max-w-md bg-black/50 backdrop-blur-sm hidden lg:block">
            <div className="flex justify-between items-center mb-4 gap-4">
                 <h3 className="text-xl font-bold whitespace-nowrap">Words of Wisdom</h3>
                 <div className="text-sm opacity-80 flex items-center gap-2">
                     <span>{currentIndex + 1} / {quotes.length}</span>
                     <span className="opacity-50">|</span>
                     <span className="whitespace-nowrap">Next in {countdown}s</span>
                 </div>
            </div>
            <blockquote className={cn("border-l-2 border-primary pl-4 transition-opacity duration-500", isFading ? "opacity-0" : "opacity-100")}>
                <p className="italic text-lg">"{currentQuote.phrase}"</p>
                <footer className="text-sm opacity-80 mt-2">
                    ~ {currentQuote.author}
                    {currentQuote.context && ` (${currentQuote.context})`}
                </footer>
            </blockquote>
        </div>
    );
}
