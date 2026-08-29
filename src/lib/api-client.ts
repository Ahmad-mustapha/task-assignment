/**
 * Browser-side fetch helpers. Used only by TanStack Query hooks — server
 * components read from `src/lib/data/` directly instead of going over HTTP.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (!response.ok) {
    // Route handlers return { error: string }; fall back if the body isn't JSON.
    const message = await response
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => null)

    throw new ApiError(
      message ?? `Request failed with status ${response.status}`,
      response.status
    )
  }

  return response.json() as Promise<T>
}
