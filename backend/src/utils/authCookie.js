const AUTH_COOKIE_NAME = 'skilllaunch_session';
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getAuthTokenFromCookieHeader(cookieHeader) {
  if (typeof cookieHeader !== 'string' || !cookieHeader.trim()) {
    return null;
  }

  const cookies = cookieHeader.split(';');
  for (const item of cookies) {
    const [rawName, ...rawValue] = item.trim().split('=');
    if (rawName === AUTH_COOKIE_NAME) {
      const value = rawValue.join('=').trim();
      return value ? decodeURIComponent(value) : null;
    }
  }

  return null;
}

function getAuthToken(req) {
  const authorization = req?.headers?.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }

  return getAuthTokenFromCookieHeader(req?.headers?.cookie);
}

function setAuthCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'None' : 'Lax';

  res.setHeader(
    'Set-Cookie',
    [
      `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${MAX_AGE_SECONDS}`,
      `SameSite=${sameSite}`,
      ...(secure ? ['Secure'] : [])
    ].join('; ')
  );
}

function clearAuthCookie(res) {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'None' : 'Lax';

  res.setHeader(
    'Set-Cookie',
    [
      `${AUTH_COOKIE_NAME}=`,
      'HttpOnly',
      'Path=/',
      'Max-Age=0',
      `SameSite=${sameSite}`,
      ...(secure ? ['Secure'] : [])
    ].join('; ')
  );
}

module.exports = {
  AUTH_COOKIE_NAME,
  getAuthToken,
  getAuthTokenFromCookieHeader,
  setAuthCookie,
  clearAuthCookie
};
