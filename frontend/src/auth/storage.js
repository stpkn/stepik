/** Простое хранение текущего пользователя после входа (без JWT) */

export const AUTH_STORAGE_KEY = "currentUser";

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.id !== "number" || !data.role) return null;
    return data;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
