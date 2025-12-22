'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4299';

export default function ConnectMetaPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check for error in URL params
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get('error');
        if (errorParam) {
            setError(decodeURIComponent(errorParam));
        }
    }, []);

    const handleConnectMeta = () => {
        setIsLoading(true);
        // Redirect to backend Meta OAuth
        window.location.href = `${API_URL}/auth/meta`;
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Connect to Facebook</CardTitle>
                    <CardDescription>
                        Connect your Facebook Page to start receiving and responding to messages
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>By connecting, you&apos;ll be able to:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>View and respond to customer messages</li>
                            <li>See your page&apos;s engagement metrics</li>
                            <li>Manage conversations in one place</li>
                        </ul>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleConnectMeta}
                            disabled={isLoading}
                            className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white"
                            size="lg"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin">⏳</span>
                                    Connecting...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                    Continue with Facebook
                                </span>
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        We&apos;ll request permissions to manage your page messages and view insights.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
