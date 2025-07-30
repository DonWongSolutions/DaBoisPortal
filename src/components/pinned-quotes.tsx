
'use client';

import { useState, useEffect } from 'react';
import type { WiseWord } from '@/lib/types';

export function PinnedQuotesClient({ quotes }: { quotes: WiseWord[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (quotes.length <= 1) return;

        const countdownInterval = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [quotes.length]);

    useEffect(() => {
        if (countdown === 0) {
            setCurrentIndex(prevIndex => (prevIndex + 1) % quotes.length);
            setCountdown(5);
        }
    }, [countdown, quotes.length]);
    
    if (quotes.length === 0) {
        return null;
    }

    const currentQuote = quotes[currentIndex];

    return (
         <div className="absolute bottom-8 right-8 text-white p-6 rounded-lg max-w-md bg-black/50 backdrop-blur-sm hidden lg:block">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold">Words of Wisdom</h3>
                 <div className="text-sm opacity-80">
                     <span>{currentIndex + 1} / {quotes.length}</span>
                     <span className="mx-2">|</span>
                     <span>Next in {countdown}s</span>
                 </div>
            </div>
            <blockquote className="border-l-2 border-primary pl-4">
                <p className="italic text-lg">"{currentQuote.phrase}"</p>
                <footer className="text-sm opacity-80 mt-2">
                    ~ {currentQuote.author}
                    {currentQuote.context && ` (${currentQuote.context})`}
                </footer>
            </blockquote>
        </div>
    );
}
