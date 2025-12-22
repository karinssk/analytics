'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { PageLayout } from '@/components/PageLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4299';

interface DailyMetric {
    date: string;
    messagesCount: number;
    uniqueSenders: number;
    videoViews: number;
    engagement: number;
}

export default function AnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.pageId as string;

    const [metrics, setMetrics] = useState<DailyMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState(7);

    useEffect(() => {
        fetchMetrics();
    }, [pageId, days]);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('auth_token');
            if (!token) {
                router.push('/connect/meta');
                return;
            }

            const response = await fetch(
                `${API_URL}/analytics/pages/${pageId}/metrics/range?days=${days}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/connect/meta');
                    return;
                }
                throw new Error('Failed to fetch metrics');
            }

            const data = await response.json();
            setMetrics(data.metrics || []);
        } catch (err) {
            setError('Failed to load analytics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getTotals = () => {
        return metrics.reduce(
            (acc, m) => ({
                messagesCount: acc.messagesCount + m.messagesCount,
                uniqueSenders: acc.uniqueSenders + m.uniqueSenders,
                videoViews: acc.videoViews + m.videoViews,
                engagement: acc.engagement + m.engagement,
            }),
            { messagesCount: 0, uniqueSenders: 0, videoViews: 0, engagement: 0 }
        );
    };

    const totals = getTotals();

    if (loading) {
        return (
            <PageLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
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
                        <h1 className="text-3xl font-bold">Analytics</h1>
                        <p className="text-muted-foreground mt-1">Last {days} days</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Date Range Selector */}
                    <div className="mb-6 flex gap-2">
                        <Button
                            variant={days === 7 ? 'default' : 'outline'}
                            onClick={() => setDays(7)}
                        >
                            7 Days
                        </Button>
                        <Button
                            variant={days === 14 ? 'default' : 'outline'}
                            onClick={() => setDays(14)}
                        >
                            14 Days
                        </Button>
                        <Button
                            variant={days === 28 ? 'default' : 'outline'}
                            onClick={() => setDays(28)}
                        >
                            28 Days
                        </Button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Messages</CardDescription>
                                <CardTitle className="text-3xl">{totals.messagesCount}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Senders</CardDescription>
                                <CardTitle className="text-3xl">{totals.uniqueSenders}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Video Views</CardDescription>
                                <CardTitle className="text-3xl">{totals.videoViews}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Engagement</CardDescription>
                                <CardTitle className="text-3xl">{totals.engagement}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Daily Metrics Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Breakdown</CardTitle>
                            <CardDescription>Metrics for each day in the selected period</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Messages</TableHead>
                                        <TableHead className="text-right">Senders</TableHead>
                                        <TableHead className="text-right">Video Views</TableHead>
                                        <TableHead className="text-right">Engagement</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {metrics.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                No data available
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        metrics.map((metric) => (
                                            <TableRow key={metric.date}>
                                                <TableCell>
                                                    {new Date(metric.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">{metric.messagesCount}</TableCell>
                                                <TableCell className="text-right">{metric.uniqueSenders}</TableCell>
                                                <TableCell className="text-right">{metric.videoViews}</TableCell>
                                                <TableCell className="text-right">{metric.engagement}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageLayout>
    );
}

