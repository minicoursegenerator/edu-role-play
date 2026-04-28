// Minimal SSE line iterator. Yields each `data:` payload string (one per event).
// Stops on `data: [DONE]` (OpenAI convention) or stream end.
export async function* sseEvents(res: Response): AsyncGenerator<string> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).replace(/\r$/, "");
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trimStart();
        if (payload === "[DONE]") return;
        yield payload;
      }
    }
    const tail = buf.trim();
    if (tail.startsWith("data:")) {
      const payload = tail.slice(5).trimStart();
      if (payload && payload !== "[DONE]") yield payload;
    }
  } finally {
    reader.releaseLock();
  }
}

export async function collectStream(stream: AsyncIterable<string>): Promise<string> {
  let out = "";
  for await (const delta of stream) out += delta;
  return out.trim();
}
