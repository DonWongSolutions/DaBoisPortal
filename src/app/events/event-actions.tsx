
'use client';

import { useFormStatus } from 'react-dom';
import { updateEventResponseAction, importCalendarAction, addEventSuggestionAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Check, X, HelpCircle, Upload, Send } from 'lucide-react';
import type { UserAvailability } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import React from 'react';

function ResponseButton({ status, currentResponse, children }: { status: UserAvailability, currentResponse: UserAvailability, children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            name="response"
            value={status}
            variant={currentResponse === status ? 'default' : 'outline'}
            size="sm"
            disabled={pending}
        >
            {children}
        </Button>
    )
}

export function EventResponseForm({ eventId, currentResponse }: { eventId: number, currentResponse: UserAvailability }) {
    const updateResponseWithId = updateEventResponseAction.bind(null, eventId);
    return (
        <form action={updateResponseWithId} className="flex gap-2">
            <ResponseButton status="yes" currentResponse={currentResponse}>
                <Check className="mr-2 h-4 w-4" /> Going
            </ResponseButton>
            <ResponseButton status="no" currentResponse={currentResponse}>
                <X className="mr-2 h-4 w-4" /> Not Going
            </ResponseButton>
            <ResponseButton status="maybe" currentResponse={currentResponse}>
                <HelpCircle className="mr-2 h-4 w-4" /> Maybe
            </ResponseButton>
        </form>
    );
}

function ImportSubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="outline" disabled={pending}>
            <Upload className="mr-2 h-4 w-4" />
            {pending ? 'Importing...' : 'Import Calendar'}
        </Button>
    );
}

export function ImportCalendarForm() {
    return (
        <form action={importCalendarAction}>
            <label htmlFor="calendar-file" className="sr-only">Upload .ics file</label>
            <input type="file" name="calendarFile" id="calendar-file" className="hidden" accept=".ics" 
                onChange={(e) => {
                    const form = e.target.form;
                    if (form) {
                        form.requestSubmit();
                    }
                }}
             />
             <Button asChild variant="outline">
                <label htmlFor="calendar-file" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Import .ics
                </label>
            </Button>
        </form>
    )
}

function SuggestionButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="sm" className="w-full" disabled={pending}>
            <Send className="mr-2 h-4 w-4" />
            {pending ? 'Submitting...' : 'Submit Suggestion'}
        </Button>
    )
}

export function SuggestionForm({ eventId }: { eventId: number }) {
    const addSuggestionWithId = addEventSuggestionAction.bind(null, eventId);
    const formRef = React.useRef<HTMLFormElement>(null);
    return (
        <form 
            action={async (formData) => {
                await addSuggestionWithId(formData);
                formRef.current?.reset();
            }}
            ref={formRef}
            className="space-y-2"
        >
            <Textarea name="suggestion" placeholder="e.g., 'Let's move this to 8 PM?'" required />
            <SuggestionButton />
        </form>
    );
}
