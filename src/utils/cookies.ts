const SMILE_MODE_COOKIE = 'snapface-smile-mode';
const COOKIE_MAX_AGE_DAYS = 365;

export function getSmileModeCookie(): boolean {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${SMILE_MODE_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`)
  );
  return match?.[1] === 'true';
}

export function setSmileModeCookie(enabled: boolean): void {
  const maxAge = COOKIE_MAX_AGE_DAYS * 86400;
  document.cookie = `${SMILE_MODE_COOKIE}=${enabled ? 'true' : 'false'}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
