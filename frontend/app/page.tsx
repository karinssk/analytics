'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUsers } from '../lib/api';
import { useAuth } from '@/lib/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/PageLayout';

// Types
interface Message {
  id: number;
  sender: string;
  content: string;
  createdAt: string;
}

interface Chat {
  id: number;
  messages: Message[];
}

interface User {
  id: number;
  lineId: string | null;
  name: string | null;
  phone: string | null;
  address: string | null;
  chats: Chat[];
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const { admin, isLoading: authLoading, logout } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !admin) {
      router.push('/login');
    }
  }, [admin, authLoading, router]);

  // Fetch users on mount
  useEffect(() => {
    if (admin) {
      fetchUsers()
        .then((data) => {
          setUsers(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch users', err);
          setLoading(false);
        });
    }
  }, [admin]);

  const handleRowClick = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const getTotalMessages = (user: User) => {
    return user.chats.reduce((total, chat) => total + chat.messages.length, 0);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!admin) {
    return null;
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading customers...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Main Content */}
      <div className="p-8 overflow-auto h-full">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
              <p className="text-muted-foreground mt-1">
                Welcome, {admin.name || admin.email}
              </p>
            </div>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>


          {/* Customer Table */}
          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>
                Click on a row to view detailed customer information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>LINE ID</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Messages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleRowClick(user)}
                      >
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{user.name || 'Unknown User'}</span>
                            {!user.name && (
                              <Badge variant="secondary" className="text-xs">
                                No Name
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {user.lineId || '-'}
                        </TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {user.address || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={getTotalMessages(user) > 0 ? 'default' : 'outline'}>
                            {getTotalMessages(user)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Customer Detail Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedUser?.name || 'Unknown User'}
                </DialogTitle>
              </DialogHeader>

              {selectedUser && (
                <div className="space-y-6 mt-4">
                  {/* Customer Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Customer ID
                          </label>
                          <p className="mt-1 font-medium">{selectedUser.id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            LINE ID
                          </label>
                          <p className="mt-1 font-mono text-sm">{selectedUser.lineId || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Phone
                          </label>
                          <p className="mt-1">{selectedUser.phone || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Total Messages
                          </label>
                          <p className="mt-1">
                            <Badge>{getTotalMessages(selectedUser)}</Badge>
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Address
                        </label>
                        <p className="mt-1">{selectedUser.address || 'No address provided'}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chat History */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Chat History</CardTitle>
                      <CardDescription>
                        All messages from this customer
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedUser.chats.flatMap((chat) => chat.messages).length > 0 ? (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                          {selectedUser.chats
                            .flatMap((chat) => chat.messages)
                            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                            .map((msg) => (
                              <div
                                key={msg.id}
                                className={`p-3 rounded-lg ${msg.sender === 'user'
                                  ? 'bg-muted'
                                  : 'bg-primary/10 border border-primary/20'
                                  }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant={msg.sender === 'user' ? 'secondary' : 'default'}>
                                    {msg.sender === 'user' ? 'Customer' : 'Bot'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(msg.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm">{msg.content}</p>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No messages found
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PageLayout>
  );
}
