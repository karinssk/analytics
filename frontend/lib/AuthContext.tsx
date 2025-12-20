'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { API_BASE_URL } from './api';

interface Admin {
    id: number;
    email: string;
    name: string | null;
}

interface AuthContextType {
    admin: Admin | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    googleLogin: (credential: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check auth on mount
    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        const token = Cookies.get('auth_token');

        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAdmin(data.admin);
            } else {
                Cookies.remove('auth_token');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            Cookies.remove('auth_token');
        } finally {
            setIsLoading(false);
        }
    }

    async function login(email: string, password: string) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        Cookies.set('auth_token', data.token, { expires: 7 });
        setAdmin(data.admin);
    }

    async function register(email: string, password: string, name?: string) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, name })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        Cookies.set('auth_token', data.token, { expires: 7 });
        setAdmin(data.admin);
    }

    async function googleLogin(credential: string) {
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ credential })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Google login failed');
        }

        Cookies.set('auth_token', data.token, { expires: 7 });
        setAdmin(data.admin);
    }

    function logout() {
        Cookies.remove('auth_token');
        setAdmin(null);
    }

    return (
        <AuthContext.Provider value={{ admin, isLoading, login, register, googleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
