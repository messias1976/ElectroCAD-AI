import { apiFetch } from './api';

export type CurrentUser = {
  id: string;
  username: string;
  email?: string | null;
  role: 'ADMIN' | 'SUBSCRIBER';
  companyName?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};

const USER_KEY = 'electrocad-user';

export function getStoredUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: CurrentUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}

export async function fetchProfile() {
  const user = await apiFetch('/auth/profile');
  setStoredUser(user);
  return user as CurrentUser;
}
