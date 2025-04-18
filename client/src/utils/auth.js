export function getToken() {
  return localStorage.getItem('token');
}

export function decodeToken() {
  const token = getToken();
  if (!token) return null;
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload;
}