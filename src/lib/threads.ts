import { PostThreadsResponse } from './types';

const { THREADS_ACCESS_TOKEN, THREADS_USER_ID } = process.env;

const BASE_URL = 'https://graph.threads.net/v1.0';

export const isThreadsConfigured = Boolean(THREADS_ACCESS_TOKEN && THREADS_USER_ID);

async function createContainer(text: string, replyToId?: string): Promise<string> {
  const params = new URLSearchParams({
    text,
    media_type: 'TEXT',
    access_token: THREADS_ACCESS_TOKEN!,
  });
  if (replyToId) {
    params.set('reply_to_id', replyToId);
  }

  const res = await fetch(`${BASE_URL}/${THREADS_USER_ID}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Container creation failed (${res.status})`);
  }

  const data = await res.json();
  return data.id as string;
}

async function publishContainer(creationId: string): Promise<string> {
  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: THREADS_ACCESS_TOKEN!,
  });

  const res = await fetch(`${BASE_URL}/${THREADS_USER_ID}/threads_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Publish failed (${res.status})`);
  }

  const data = await res.json();
  return data.id as string;
}

export async function postSingleThreadsPost(text: string): Promise<PostThreadsResponse> {
  if (!isThreadsConfigured) {
    return { success: false, error: 'Threads API not configured' };
  }
  try {
    const creationId = await createContainer(text);
    const threadId = await publishContainer(creationId);
    return { success: true, threadId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function postThreadsThread(tweets: string[]): Promise<PostThreadsResponse> {
  if (!isThreadsConfigured) {
    return { success: false, error: 'Threads API not configured' };
  }
  try {
    let previousId: string | undefined;
    let firstId: string | undefined;

    for (const text of tweets) {
      const creationId = await createContainer(text, previousId);
      const publishedId = await publishContainer(creationId);
      if (!firstId) firstId = publishedId;
      previousId = publishedId;
    }

    return { success: true, threadId: firstId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
