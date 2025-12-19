export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://data-api.rubyshop.co.th';

export async function fetchUsers() {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }
    return response.json();
}
