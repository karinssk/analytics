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

interface Metrics {
    date: string;
    messagesCount: number;
    uniqueSenders: number;
    videoViews: number;
    engagement: number;
}

type RangePreset = 'today' | 'week' | 'month';

interface NewPsidRow {
    date: string;
    newPsids: number;
}

interface NewPsidResponse {
    pageId: string;
    pageName: string;
    range: {
        preset: string;
        start: string;
        end: string;
    };
    totals: {
        newPsids: number;
    };
    todayNewPsids: number;
    rows: NewPsidRow[];
}

export default function DashboardPage() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.pageId as string;

    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pageName, setPageName] = useState<string>('');

    const [rangePreset, setRangePreset] = useState<RangePreset>('week');
    const [newPsidRows, setNewPsidRows] = useState<NewPsidRow[]>([]);
    const [todayNewPsids, setTodayNewPsids] = useState<number>(0);
    const [rangeTotalNewPsids, setRangeTotalNewPsids] = useState<number>(0);
    const [newPsidError, setNewPsidError] = useState<string | null>(null);
    const [newPsidLoading, setNewPsidLoading] = useState<boolean>(true);

    const [insightsTotals, setInsightsTotals] = useState<{ impressions: number; engagedUsers: number }>({ impressions: 0, engagedUsers: 0 });
    const [insightsError, setInsightsError] = useState<string | null>(null);
    const [insightsLoading, setInsightsLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchMetrics();
    }, [pageId]);

    useEffect(() => {
        fetchNewPsidStats(rangePreset);
    }, [pageId, rangePreset]);

    useEffect(() => {
        fetchInsights();
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

    const fetchInsights = async () => {
        setInsightsLoading(true);
        try {
            const token = Cookies.get('auth_token');
            if (!token) {
                router.push('/connect/meta');
                return;
            }
            const res = await fetch(`${API_URL}/analytics/pages/${pageId}/insights?days=7`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch insights');
            const data = await res.json();
            setInsightsTotals({
                impressions: data?.totals?.impressions || 0,
                engagedUsers: data?.totals?.engagedUsers || 0
            });
            setInsightsError(null);
        } catch (err) {
            console.error(err);
            setInsightsError('Failed to load insights');
        } finally {
            setInsightsLoading(false);
        }
    };

    const fetchNewPsidStats = async (range: RangePreset) => {
        setNewPsidLoading(true);
        try {
            const token = Cookies.get('auth_token');
            if (!token) {
                router.push('/connect/meta');
                return;
            }

            const response = await fetch(`${API_URL}/analytics/pages/${pageId}/new-psids?range=${range}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/connect/meta');
                    return;
                }
                throw new Error('Failed to fetch new PSID stats');
            }

            const data: NewPsidResponse = await response.json();
            setNewPsidRows(data.rows || []);
            setTodayNewPsids(data.todayNewPsids || 0);
            setRangeTotalNewPsids(data.totals?.newPsids || 0);
            setPageName(data.pageName || '');
            setNewPsidError(null);
        } catch (err) {
            setNewPsidError('Failed to load new PSID stats');
            console.error(err);
        } finally {
            setNewPsidLoading(false);
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
                        {/* Impressions (7d) */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Impressions (7d)</CardDescription>
                                <CardTitle className="text-4xl font-bold">
                                    {insightsLoading ? '—' : insightsTotals.impressions}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Views across your content this week
                                </p>
                                {insightsError && (
                                    <p className="text-xs text-destructive mt-2">{insightsError}</p>
                                )}
                            </CardContent>
                        </Card>
                        {/* Engaged Users (7d) */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Engaged Users (7d)</CardDescription>
                                <CardTitle className="text-4xl font-bold">
                                    {insightsLoading ? '—' : insightsTotals.engagedUsers}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    People who interacted with your page this week
                                </p>
                                {insightsError && (
                                    <p className="text-xs text-destructive mt-2">{insightsError}</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* New PSID Table */}
                    <Card className="mb-8">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-xl">New PSIDs</CardTitle>
                                    <CardDescription>
                                        First-time contacts captured per day
                                    </CardDescription>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {pageName ? `${pageName} • ` : ''}Today: <span className="font-semibold text-foreground">{todayNewPsids}</span> new {todayNewPsids === 1 ? 'user' : 'users'}
                                    </p>
                                </div>
                                <div className="inline-flex rounded-lg border bg-muted/50 p-1">
                                    {(['today', 'week', 'month'] as RangePreset[]).map((preset) => (
                                        <Button
                                            key={preset}
                                            size="sm"
                                            variant={rangePreset === preset ? 'default' : 'ghost'}
                                            className="capitalize"
                                            onClick={() => setRangePreset(preset)}
                                        >
                                            {preset === 'today' && 'Today'}
                                            {preset === 'week' && 'This Week'}
                                            {preset === 'month' && 'This Month'}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {newPsidError && (
                                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                    {newPsidError}
                                </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground mb-4">
                                <span>
                                    Tracking first messages from new PSIDs. <span className="text-foreground font-semibold">{rangeTotalNewPsids}</span> new {rangeTotalNewPsids === 1 ? 'contact' : 'contacts'} in this range.
                                </span>
                                <span className="text-foreground font-medium capitalize">
                                    {rangePreset === 'week' ? 'This Week' : rangePreset === 'month' ? 'This Month' : 'Today'}
                                </span>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Page</TableHead>
                                        <TableHead className="text-right">New PSIDs</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {newPsidLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                Loading new PSIDs...
                                            </TableCell>
                                        </TableRow>
                                    ) : newPsidRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                No new contacts in this range
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        newPsidRows.map((row) => (
                                            <TableRow key={row.date}>
                                                <TableCell>
                                                    {new Date(row.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {pageName || 'Current Page'}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {row.newPsids}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

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
