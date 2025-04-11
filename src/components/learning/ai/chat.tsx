'use client';

import React, { useEffect, useRef } from 'react';
import { type Message } from '@ai-sdk/react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Loader2, CornerDownLeft, ArrowUp } from 'lucide-react';
import { MessageRenderer } from './MessageRenderer';

// Define the new props for the Chat component based on useChat return values
interface ChatProps {
    messages: Message[];
    input: string;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
    error: Error | undefined;
    reload: () => void;
    stop: () => void;
}

export function Chat({
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop
}: ChatProps) {

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        const scrollElement = scrollAreaRef.current?.children[1] as HTMLDivElement | undefined;
        if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
        }
    }, [messages]);

    // Adjust textarea height based on content
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto'; // Reset height
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [input]);

    // Handle Shift+Enter for new lines, Enter for submit
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default Enter behavior (new line)
            // Manually trigger form submission if input is not empty and not loading
            if (input.trim() && !isLoading) {
                const form = e.currentTarget.closest('form');
                if (form) {
                    // Create a synthetic event if needed or directly call handleSubmit
                    // This depends on how handleSubmit expects the event
                    handleSubmit(e as any); // Might need adjustment based on handleSubmit type
                }
            }
        }
        // Shift+Enter will naturally create a new line in textarea
    };

    return (
        <Card className="h-full flex flex-col bg-transparent border-none shadow-none relative py-0">
            <CardContent className="flex-1 overflow-hidden p-0 pb-0">
                <ScrollArea className="h-full px-4 focus:outline-none" ref={scrollAreaRef} tabIndex={0}>
                    <div className="space-y-4 py-4 pb-24">
                        {messages.map((m: Message) => (
                            <div
                                key={m.id}
                                className={cn(
                                    "flex items-start gap-3",
                                    m.role === 'user' ? "justify-end" : ""
                                )}
                            >
                                {m.role === 'assistant' && (
                                    <Avatar className="h-8 w-8 border bg-primary/10 text-primary shrink-0">
                                        <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                        "rounded-lg px-3 py-2 text-sm max-w-[80%] break-words shadow-sm",
                                        m.role === 'user'
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-gradient-to-br from-indigo-500/40 via-purple-500/40 to-pink-500/40 text-white"
                                    )}
                                >
                                    <MessageRenderer content={m.content} />
                                </div>
                                {m.role === 'user' && (
                                    <Avatar className="h-8 w-8 border shrink-0">
                                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 border bg-primary/10 text-primary shrink-0">
                                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                                <div className={cn(
                                    "rounded-lg px-3 py-2 text-sm flex items-center shadow-sm",
                                    "bg-gradient-to-br from-indigo-500/40 via-purple-500/40 to-pink-500/40 text-white opacity-70"
                                )}>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    <span>Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <div className='p-4 bg-transparent absolute bottom-0 left-0 right-0'>
                {error && (
                    <div className="text-xs text-red-500 mb-2 flex items-center justify-between w-full px-2">
                        <p>Error: {error.message}</p>
                        <Button variant="ghost" size="sm" onClick={() => reload()}>Retry</Button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="relative flex w-full items-end gap-2 p-1 bg-background rounded-lg border border-border shadow-sm">
                    <Textarea
                        ref={textAreaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask the assistant (Shift+Enter for new line)"
                        disabled={isLoading}
                        className="flex-1 resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none p-2 pr-12 min-h-[40px] max-h-[200px] overflow-y-auto text-sm"
                        rows={1}
                    />
                    <div className="absolute bottom-2 right-2 flex items-center">
                        {isLoading ? (
                            <Button type="button" size="icon" variant="ghost" onClick={stop} title="Stop generating" className="h-8 w-8">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || isLoading}
                                title="Send message (Enter)"
                                className="h-8 w-8 bg-primary/90 hover:bg-primary text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
                            >
                                <ArrowUp className="size-4" />
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </Card>
    );
}
