'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/PageLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4299';

interface Conversation {
    id: number;
    psid: string;
    pageName: string;
    pagePid: string;
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

export default function InboxAllPages() {
    const router = useRouter();

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
    }, []);

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

            const response = await fetch(`${API_URL}/inbox/conversations`, {
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
            <PageLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-pulse text-muted-foreground">Loading inbox...</div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="flex flex-col h-full">
                {error && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm text-center shrink-0">
                        {error}
                        <button className="ml-2 underline" onClick={() => setError(null)}>Dismiss</button>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Thread List */}
                    <div className="w-96 border-r bg-card overflow-y-auto shrink-0">
                        <div className="p-4 border-b">
                            <h2 className="font-semibold">Conversations</h2>
                            <p className="text-sm text-muted-foreground">{conversations.length} threads</p>
                        </div>
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
                                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                                        {conv.pageName}
                                    </div>
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
                                <div className="p-4 border-b bg-card shrink-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs uppercase text-muted-foreground">{conversations.find(c => c.id === selectedConversation.id)?.pageName || 'Page'}</div>
                                            <h2 className="font-semibold">{selectedConversation.customerName}</h2>
                                            <p className="text-sm text-muted-foreground">
                                                Last message: {formatTimeAgo(selectedConversation.lastCustomerMessageAt)}
                                            </p>
                                        </div>
                                        {selectedConversation.timeRemaining !== null && (
                                            <Badge variant="outline">
                                                {selectedConversation.isReplyAllowed
                                                    ? `${formatTimeRemaining(selectedConversation.timeRemaining)}`
                                                    : '24h window expired'}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`${msg.direction === 'OUTBOUND' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                                                } rounded-lg px-3 py-2 max-w-xl`}>
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                <p className="text-[11px] text-muted-foreground mt-1 text-right">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Composer */}
                                <div className="p-4 border-t bg-card flex items-center gap-3">
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        disabled={!selectedConversation}
                                    />
                                    <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim() || !selectedConversation}>
                                        {sending ? 'Sending...' : 'Send'}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                Select a conversation to view messages
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
