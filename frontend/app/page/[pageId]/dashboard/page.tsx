'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { PageLayout } from '@/components/PageLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4299';

interface Metrics {
    date: string;
    messagesCount: number;
    uniqueSenders: number;
    videoViews: number;
    engagement: number;
}

export default function DashboardPage() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.pageId as string;

    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMetrics();
    }, [pageId]);

    const fetchMetrics = async () => {
        try {
            const token = Cookies.get('auth_token');
            if (!token) {
                router.push('/connect/meta');
                return;
            }

            const response = await fetch(`${API_URL}/analytics/pages/${pageId}/metrics/today`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/connect/meta');
                    return;
                }
                throw new Error('Failed to fetch metrics');
            }

            const data = await response.json();
            setMetrics(data);
        } catch (err) {
            setError('Failed to load dashboard metrics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <PageLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Today&apos;s Overview</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Messages Today */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Messages Today</CardDescription>
                                <CardTitle className="text-4xl font-bold">
                                    {metrics?.messagesCount || 0}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Total messages received and sent
                                </p>
                            </CardContent>
                        </Card>

                        {/* Unique Senders */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Unique Senders</CardDescription>
                                <CardTitle className="text-4xl font-bold">
                                    {metrics?.uniqueSenders || 0}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    People who messaged you today
                                </p>
                            </CardContent>
                        </Card>

                        {/* Video Views */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Video Views</CardDescription>
                                <CardTitle className="text-4xl font-bold">
                                    {metrics?.videoViews || 0}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Total video views today
                                </p>
                            </CardContent>
                        </Card>

                        {/* Engagement */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Engagement</CardDescription>
                                <CardTitle className="text-4xl font-bold">
                                    {metrics?.engagement || 0}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    People engaged with your page
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Alert for no activity */}
                    {metrics && metrics.messagesCount === 0 && metrics.uniqueSenders === 0 && (
                        <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                            <CardHeader>
                                <CardTitle className="text-amber-800 dark:text-amber-200 text-lg">
                                    📢 No messages today
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-amber-700 dark:text-amber-300 text-sm">
                                    Consider boosting your top post or running a promotion to increase engagement with your audience.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
