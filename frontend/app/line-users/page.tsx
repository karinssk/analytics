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

interface LineUserRow {
    lineId: string;
    name: string | null;
    messageCount: number;
}

interface LineUserStats {
    totals: {
        users: number;
        messages: number;
    };
    range: {
        start: string | null;
        end: string | null;
    };
    users: LineUserRow[];
}

export default function LineUsersPage() {
    const router = useRouter();
    const [from, setFrom] = useState<string>('');
    const [to, setTo] = useState<string>('');
    const [stats, setStats] = useState<LineUserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('auth_token');
            if (!token) {
                router.push('/connect/meta');
                return;
            }

            const params = new URLSearchParams();
            if (from) params.append('from', from);
            if (to) params.append('to', to);

            const response = await fetch(`${API_URL}/users/line/stats?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/connect/meta');
                    return;
                }
                throw new Error('Failed to fetch LINE user stats');
            }

            const data: LineUserStats = await response.json();
            setStats(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load LINE user stats');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageLayout>
            <div className="p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">LINE Users</h1>
                            <p className="text-muted-foreground mt-1">
                                Count of LINE users (lineId) and their message totals, similar to Facebook PSIDs.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm"
                            />
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm"
                            />
                            <Button onClick={fetchStats} disabled={loading}>
                                {loading ? 'Loading...' : 'Apply'}
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total LINE Users</CardDescription>
                                <CardTitle className="text-4xl font-bold">
                                    {stats?.totals.users ?? 0}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Messages</CardDescription>
                                <CardTitle className="text-4xl font-bold">
                                    {stats?.totals.messages ?? 0}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Date Range</CardDescription>
                                <CardTitle className="text-lg font-semibold">
                                    {stats?.range.start
                                        ? `${new Date(stats.range.start).toLocaleDateString()} — ${stats.range.end ? new Date(stats.range.end).toLocaleDateString() : 'now'}`
                                        : 'All time'}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Users and Messages</CardTitle>
                            <CardDescription>Each LINE user ID with its message count</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>LINE ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="text-right">Messages</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : !stats?.users?.length ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                No LINE users found for this range
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        stats.users.map((user) => (
                                            <TableRow key={user.lineId}>
                                                <TableCell className="font-mono text-xs">{user.lineId}</TableCell>
                                                <TableCell>{user.name || 'Unknown User'}</TableCell>
                                                <TableCell className="text-right font-semibold">{user.messageCount}</TableCell>
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
