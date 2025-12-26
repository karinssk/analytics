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

interface FacebookPageRow {
    pageId: string;
    pageName: string;
    newPsids: number;
}

interface FacebookStats {
    pages: FacebookPageRow[];
    totalNewPsids: number;
}

interface LineStats {
    totalUsers: number;
    totalMessages: number;
}

interface ReportResponse {
    date: string;
    facebook: FacebookStats;
    line: LineStats;
}

export default function LineReportPage() {
    const router = useRouter();
    const [report, setReport] = useState<ReportResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scheduleTime, setScheduleTime] = useState<string>('');
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const withAuth = () => {
        const token = Cookies.get('auth_token');
        if (!token) {
            router.push('/connect/meta');
            throw new Error('No auth token');
        }
        return token;
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const token = withAuth();
            const response = await fetch(`${API_URL}/reports/line`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch report');
            const data: ReportResponse = await response.json();
            setReport(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    const handleSendNow = async () => {
        try {
            const token = withAuth();
            const res = await fetch(`${API_URL}/reports/line/send-now`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to send test report');
            setActionMessage('Test report sent via LINE.');
        } catch (err) {
            console.error(err);
            setActionMessage('Failed to send test report.');
        }
    };

    const handleSchedule = async () => {
        if (!scheduleTime) {
            setActionMessage('Please pick a time (HH:MM).');
            return;
        }
        try {
            const token = withAuth();
            const res = await fetch(`${API_URL}/reports/line/schedule`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ time: scheduleTime })
            });
            if (!res.ok) throw new Error('Failed to schedule report');
            setActionMessage(`Report scheduled daily at ${scheduleTime}.`);
        } catch (err) {
            console.error(err);
            setActionMessage('Failed to schedule report.');
        }
    };

    return (
        <PageLayout>
            <div className="p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Line Report</h1>
                            <p className="text-muted-foreground mt-1">
                                Combined Facebook PSID stats and LINE user/message counts for {report?.date || 'today'}.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <input
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm"
                                placeholder="HH:MM"
                            />
                            <Button variant="outline" onClick={handleSchedule}>
                                Schedule Daily
                            </Button>
                            <Button onClick={handleSendNow}>
                                Send Test Now
                            </Button>
                            <Button variant="secondary" onClick={fetchReport}>
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {actionMessage && (
                        <div className="p-3 rounded-lg bg-muted text-sm text-foreground flex items-center justify-between">
                            <span>{actionMessage}</span>
                            <button className="text-xs underline" onClick={() => setActionMessage(null)}>Dismiss</button>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Facebook Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Facebook Statics</CardTitle>
                            <CardDescription>New PSIDs per page for {report?.date || 'today'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Page</TableHead>
                                        <TableHead className="text-right">New PSIDs</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : !report?.facebook?.pages?.length ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                                                No Facebook pages found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        report.facebook.pages.map((row) => (
                                            <TableRow key={row.pageId}>
                                                <TableCell>{row.pageName}</TableCell>
                                                <TableCell className="text-right font-semibold">{row.newPsids}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <p className="text-sm text-muted-foreground mt-3">
                                Total new PSIDs: <span className="font-semibold text-foreground">{report?.facebook?.totalNewPsids ?? 0}</span>
                            </p>
                        </CardContent>
                    </Card>

                    {/* LINE Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>LINE Statics</CardTitle>
                            <CardDescription>User and message totals for {report?.date || 'today'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg bg-muted/30">
                                    <p className="text-sm text-muted-foreground">Total Users</p>
                                    <p className="text-3xl font-bold">{report?.line?.totalUsers ?? 0}</p>
                                </div>
                                <div className="p-4 border rounded-lg bg-muted/30">
                                    <p className="text-sm text-muted-foreground">Total Messages</p>
                                    <p className="text-3xl font-bold">{report?.line?.totalMessages ?? 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageLayout>
    );
}
