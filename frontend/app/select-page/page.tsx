'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4299';

interface FacebookPage {
    id: string;
    name: string;
    category?: string;
    isConnected: boolean;
    accessToken: string;
}

export default function SelectPagePage() {
    const router = useRouter();
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const token = Cookies.get('auth_token');
            if (!token) {
                router.push('/connect/meta');
                return;
            }

            const response = await fetch(`${API_URL}/meta/pages`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/connect/meta');
                    return;
                }
                throw new Error('Failed to fetch pages');
            }

            const data = await response.json();
            setPages(data.pages || []);
        } catch (err) {
            setError('Failed to load your Facebook pages');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (page: FacebookPage) => {
        setConnecting(page.id);
        try {
            const token = Cookies.get('auth_token');
            const response = await fetch(`${API_URL}/meta/pages/${page.id}/connect`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    accessToken: page.accessToken,
                    name: page.name
                })
            });

            if (!response.ok) {
                throw new Error('Failed to connect page');
            }

            // Navigate to the page dashboard
            router.push(`/page/${page.id}/dashboard`);
        } catch (err) {
            setError('Failed to connect page');
            console.error(err);
        } finally {
            setConnecting(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading your pages...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold mb-2">Select a Page</h1>
                    <p className="text-muted-foreground">
                        Choose which Facebook Page you want to connect
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                        {error}
                    </div>
                )}

                {pages.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-muted-foreground mb-4">
                                No Facebook Pages found. Make sure you have admin access to at least one Page.
                            </p>
                            <Button variant="outline" onClick={() => router.push('/connect/meta')}>
                                Try Again
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {pages.map((page) => (
                            <Card key={page.id} className="overflow-hidden">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{page.name}</CardTitle>
                                            {page.category && (
                                                <CardDescription>{page.category}</CardDescription>
                                            )}
                                        </div>
                                        {page.isConnected ? (
                                            <Badge variant="default" className="bg-green-600">
                                                Connected
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Not Connected</Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex gap-2">
                                        {page.isConnected ? (
                                            <>
                                                <Button
                                                    variant="default"
                                                    onClick={() => router.push(`/page/${page.id}/dashboard`)}
                                                >
                                                    Open Dashboard
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => router.push(`/page/${page.id}/inbox`)}
                                                >
                                                    Go to Inbox
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                onClick={() => handleConnect(page)}
                                                disabled={connecting === page.id}
                                            >
                                                {connecting === page.id ? 'Connecting...' : 'Connect Page'}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
