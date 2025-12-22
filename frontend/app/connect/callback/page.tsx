'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function CallbackPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const errorParam = params.get('error');

        if (errorParam) {
            setError(decodeURIComponent(errorParam));
            setTimeout(() => {
                router.push('/connect/meta?error=' + encodeURIComponent(errorParam));
            }, 2000);
            return;
        }

        if (token) {
            // Save token and redirect to page selection
            Cookies.set('auth_token', token, { expires: 7 });
            router.push('/select-page');
        } else {
            setError('No token received');
            setTimeout(() => {
                router.push('/connect/meta?error=no_token');
            }, 2000);
        }
    }, [router]);

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive mb-2">Error: {error}</p>
                    <p className="text-muted-foreground">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-muted-foreground">Processing login...</p>
            </div>
        </div>
    );
}
