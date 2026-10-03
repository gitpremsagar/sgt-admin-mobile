import { isAxiosError } from 'axios';

export function getErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

type Issue = { message?: string; path?: (string | number)[] };

/** Backend sends `{ message: string }`, `{ message: ZodIssue[] }` or `{ message: ZodError }`. */
function messageFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return typeof payload === 'string' ? payload : null;
  const data = payload as { message?: unknown; error?: unknown; issues?: Issue[] };
  const raw = data.message ?? data.error;
  if (typeof raw === 'string' && raw.trim()) return raw;
  const issues: Issue[] | undefined = Array.isArray(raw)
    ? (raw as Issue[])
    : raw && typeof raw === 'object' && Array.isArray((raw as { issues?: Issue[] }).issues)
      ? (raw as { issues: Issue[] }).issues
      : data.issues;
  if (issues?.length) {
    return issues
      .map((i) => (i.path?.length ? `${i.path.join('.')}: ${i.message}` : i.message))
      .filter(Boolean)
      .join('\n');
  }
  return null;
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const serverMessage = messageFromPayload(error.response?.data);
    if (serverMessage) return serverMessage;
    if (!error.response) return 'Network error. Check your internet connection.';
    if (status === 401) return 'Your session has expired. Please log in again.';
    if (status === 403) return 'You do not have permission to do this.';
    if (status === 404) return 'Not found.';
    if (status && status >= 500) return 'Server error. Please try again shortly.';
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}
