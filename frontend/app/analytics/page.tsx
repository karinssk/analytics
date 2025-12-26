'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { PageLayout } from '@/components/PageLayout';
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4299';

type RangePreset = 'today' | 'week' | 'month';

interface PagePsidRow {
    pageId: string;
    pageName: string;
    newPsids: number;
}

interface PsidSummaryResponse {
    range: {
        preset: string;
        start: string;
        end: string;
    };
    totalNewPsids: number;
    pages: PagePsidRow[];
}

export default function AllPagesAnalytics() {
    const router = useRouter();
    const [rangePreset, setRangePreset] = useState<RangePreset>('week');
    const [data, setData] = useState<PsidSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rangePreset]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('auth_token');
            if (!token) {
                router.push('/connect/meta');
                return;
            }

            const response = await fetch(
                `${API_URL}/analytics/pages/new-psids?range=${rangePreset}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/connect/meta');
                    return;
                }
                throw new Error('Failed to fetch PSID summary');
            }

            const json: PsidSummaryResponse = await response.json();
            setData(json);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load pages');
        } finally {
            setLoading(false);
        }
    };

    const formatRangeLabel = () => {
        if (!data?.range) return '';
        const start = new Date(data.range.start);
        const end = new Date(data.range.end);
        return `${start.toLocaleDateString()} — ${end.toLocaleDateString()}`;
    };

    return (
        <PageLayout>
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">All Pages</h1>
                            <p className="text-muted-foreground mt-1">
                                Page name and new PSID counts in the selected date range.
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

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total New PSIDs</CardDescription>
                                <CardTitle className="text-4xl font-bold">
                                    {data?.totalNewPsids ?? 0}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Sum of first-time contacts across all pages in this range.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Pages</CardDescription>
                                <CardTitle className="text-4xl font-bold">
                                    {data?.pages?.length ?? 0}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Pages included based on your workspace access.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Date Range</CardDescription>
                                <CardTitle className="text-xl font-semibold">
                                    {data ? formatRangeLabel() : '—'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Select a preset to change the window.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pages and New PSIDs</CardTitle>
                            <CardDescription>Counts of first-time contacts per page</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Page Name</TableHead>
                                        <TableHead>Page ID</TableHead>
                                        <TableHead className="text-right">New PSIDs</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                Loading pages...
                                            </TableCell>
                                        </TableRow>
                                    ) : !data?.pages?.length ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                No pages found for this range
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.pages.map((row) => (
                                            <TableRow key={row.pageId}>
                                                <TableCell className="font-medium">{row.pageName || 'Untitled Page'}</TableCell>
                                                <TableCell className="text-muted-foreground">{row.pageId}</TableCell>
                                                <TableCell className="text-right font-semibold">{row.newPsids}</TableCell>
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
