/** Bound decoded provider responses and keep provider failure bodies private. */
const MAX_PROVIDER_JSON_BYTES = 8 * 1024 * 1024;
const PROVIDER_DEADLINE_MS = 30_000;

class ProviderResponseError extends Error {}

export async function fetchProviderJson<T>(
  url: string,
  init: RequestInit,
  provider: "Google Maps" | "LLM"
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...init,
      redirect: "error",
      signal: AbortSignal.timeout(PROVIDER_DEADLINE_MS),
    });
    if (!response.ok) {
      void response.body?.cancel().catch(() => {});
      throw new ProviderResponseError(`${provider} request failed (HTTP ${response.status})`);
    }
    const tooLarge = () => new ProviderResponseError(`${provider} response exceeds the ${MAX_PROVIDER_JSON_BYTES}-byte limit`);
    const declared = response.headers.get("content-length");
    if (declared && /^\d+$/.test(declared) && Number(declared) > MAX_PROVIDER_JSON_BYTES) {
      void response.body?.cancel().catch(() => {});
      throw tooLarge();
    }
    if (!response.body) throw new ProviderResponseError(`${provider} returned invalid JSON`);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_PROVIDER_JSON_BYTES) {
          void reader.cancel().catch(() => {});
          throw tooLarge();
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    try {
      return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as T;
    } catch {
      throw new ProviderResponseError(`${provider} returned invalid JSON`);
    }
  } catch (error) {
    if (error instanceof ProviderResponseError) throw error;
    throw new Error(`${provider} request could not be completed`);
  }
}
