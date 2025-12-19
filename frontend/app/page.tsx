'use client';

import { useState, useEffect } from 'react';
import { fetchUsers } from '../lib/api';

// Types (simplified)
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

  // Fetch users on mount
  useEffect(() => {
    fetchUsers()
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch users', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar: User List */}
      <div className="w-1/4 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">Chats</h1>
        </div>
        <ul>
          {users.map((user) => (
            <li
              key={user.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="font-semibold">{user.name || 'Unknown User'}</div>
              <div className="text-sm text-gray-500 truncate">{user.lineId}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Area: Chat & Info */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-200 shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">{selectedUser.name || 'Unknown User'}</h2>
                <div className="text-sm text-gray-500">LINE ID: {selectedUser.lineId}</div>
              </div>
              <div className="text-right text-sm">
                <div>Phone: <span className="font-medium">{selectedUser.phone || '-'}</span></div>
                <div>Address: <span className="font-medium">{selectedUser.address || '-'}</span></div>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {selectedUser.chats.flatMap(chat => chat.messages).length > 0 ? (
                selectedUser.chats.flatMap(chat => chat.messages).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow ${msg.sender === 'user'
                        ? 'bg-white text-gray-800 border border-gray-200'
                        : 'bg-blue-500 text-white'
                        }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-gray-400' : 'text-blue-100'}`}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 mt-10">No messages found</div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a user to view chat history
          </div>
        )}
      </div>
    </div>
  );
}
