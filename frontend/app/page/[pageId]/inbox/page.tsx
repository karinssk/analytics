'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4299';

interface Conversation {
    id: number;
    psid: string;
    customerName: string;
    lastMessageAt: string;
    lastMessagePreview: string;
    lastCustomerMessageAt: string;
    isReplyAllowed: boolean;
    timeRemaining: number | null;
}

interface Message {
    id: number;
    direction: 'INBOUND' | 'OUTBOUND';
    content: string;
    timestamp: string;
}

interface ConversationDetail {
    id: number;
    customerName: string;
    isReplyAllowed: boolean;
    timeRemaining: number | null;
    lastCustomerMessageAt: string;
}

export default function InboxPage() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.pageId as string;

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchConversations();
    }, [pageId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const token = Cookies.get('auth_token');
            if (!token) {
                router.push('/connect/meta');
                return;
            }

            const response = await fetch(`${API_URL}/inbox/pages/${pageId}/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/connect/meta');
                    return;
                }
                throw new Error('Failed to fetch conversations');
            }

            const data = await response.json();
            setConversations(data.conversations || []);
        } catch (err) {
            setError('Failed to load conversations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId: number) => {
        try {
            const token = Cookies.get('auth_token');
            const response = await fetch(`${API_URL}/inbox/conversations/${conversationId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch messages');

            const data = await response.json();
            setSelectedConversation(data.conversation);
            setMessages(data.messages || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        setSending(true);
        try {
            const token = Cookies.get('auth_token');
            const response = await fetch(`${API_URL}/inbox/conversations/${selectedConversation.id}/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: newMessage })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.reason === '24h_window_expired') {
                    setError('24-hour window expired. Waiting for customer message.');
                    // Refresh conversation status
                    fetchMessages(selectedConversation.id);
                } else {
                    throw new Error(data.error || 'Failed to send message');
                }
                return;
            }

            // Add message to list
            setMessages([...messages, data.message]);
            setNewMessage('');
        } catch (err) {
            setError('Failed to send message');
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const formatTimeRemaining = (ms: number | null) => {
        if (!ms || ms <= 0) return 'Expired';
        const hours = Math.floor(ms / 3600000);
        const mins = Math.floor((ms % 3600000) / 60000);
        return `${hours}h ${mins}m remaining`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading inbox...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b bg-card shrink-0">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">Inbox</h1>
                        <p className="text-sm text-muted-foreground">
                            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push(`/page/${pageId}/dashboard`)}>
                            Dashboard
                        </Button>
                        <Button variant="ghost" onClick={() => router.push('/select-page')}>
                            Switch Page
                        </Button>
                    </div>
                </div>
            </header>

            {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm text-center">
                    {error}
                    <button className="ml-2 underline" onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Thread List */}
                <div className="w-80 border-r bg-card overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            No conversations yet
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => fetchMessages(conv.id)}
                                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedConversation?.id === conv.id ? 'bg-muted' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <span className="font-medium truncate flex-1">{conv.customerName}</span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                        {formatTimeAgo(conv.lastMessageAt)}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate mb-2">
                                    {conv.lastMessagePreview}
                                </p>
                                <Badge variant={conv.isReplyAllowed ? 'default' : 'secondary'} className="text-xs">
                                    {conv.isReplyAllowed ? '✓ Can Reply' : '⏳ Waiting'}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>

                {/* Chat Window */}
                <div className="flex-1 flex flex-col">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b bg-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-semibold">{selectedConversation.customerName}</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Last message: {formatTimeAgo(selectedConversation.lastCustomerMessageAt)}
                                        </p>
                                    </div>
                                    <Badge variant={selectedConversation.isReplyAllowed ? 'default' : 'destructive'}>
                                        {selectedConversation.isReplyAllowed
                                            ? formatTimeRemaining(selectedConversation.timeRemaining)
                                            : '24h Window Expired'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] p-3 rounded-lg ${msg.direction === 'OUTBOUND'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={`text-xs mt-1 ${msg.direction === 'OUTBOUND'
                                                    ? 'text-primary-foreground/70'
                                                    : 'text-muted-foreground'
                                                }`}>
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Box */}
                            <div className="p-4 border-t bg-card">
                                {selectedConversation.isReplyAllowed ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type a message..."
                                            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            disabled={sending}
                                        />
                                        <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                                            {sending ? 'Sending...' : 'Send'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <p className="text-muted-foreground">
                                            ⏳ Waiting for customer message
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            The 24-hour messaging window has expired. You can reply once the customer sends a new message.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            Select a conversation to start chatting
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
