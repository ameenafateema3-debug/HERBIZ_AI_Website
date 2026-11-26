export class ApiRequestError extends Error {
  status: number;
  missingFields?: string[];

  constructor(message: string, status: number, missingFields?: string[]) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.missingFields = missingFields;
  }
}

/**
 * Safely executes a fetch() request, checks response.ok, and parses JSON
 * without throwing raw SyntaxError on 404 HTML or plain-text responses.
 */
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  });

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const rawText = await response.text();
  const trimmed = rawText.trim();

  let parsed: unknown = null;
  if (
    trimmed.length > 0 &&
    (contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('['))
  ) {
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    if (
      parsed &&
      typeof parsed === 'object' &&
      'error' in parsed &&
      typeof (parsed as { error?: unknown }).error === 'string'
    ) {
      const missingFields =
        'missingFields' in parsed &&
        Array.isArray((parsed as { missingFields?: unknown }).missingFields)
          ? (parsed as { missingFields: string[] }).missingFields
          : undefined;
      throw new ApiRequestError((parsed as { error: string }).error, response.status, missingFields);
    }

    if (response.status === 404) {
      throw new ApiRequestError(
        `API endpoint ${url} returned HTTP 404 (Not Found). Please ensure the server API routes are deployed.`,
        404
      );
    }

    const plainSnippet = trimmed.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
    throw new ApiRequestError(
      plainSnippet
        ? `Server returned HTTP ${response.status}: ${plainSnippet}`
        : `Request failed with HTTP ${response.status}.`,
      response.status
    );
  }

  if (parsed === null) {
    throw new ApiRequestError(
      `Expected a JSON response from ${url}, but received ${contentType || 'non-JSON content'}.`,
      response.status
    );
  }

  return parsed as T;
}
