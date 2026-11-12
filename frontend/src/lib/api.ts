const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '');
