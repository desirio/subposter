import { PostThreadsResponse } from './types';

const BASE_URL = 'https://graph.threads.net/v1.0';

export interface ThreadsCredentials {
  accessToken: string;
  userId: string;
}

async function createContainer(
  text: string,
  creds: ThreadsCredentials,
  replyToId?: string
): Promise<string> {
  const params = new URLSearchParams({
    text,
    media_type: 'TEXT',
    access_token: creds.accessToken,
  });
  if (replyToId) {
    params.set('reply_to_id', replyToId);
  }

  const res = await fetch(`${BASE_URL}/${creds.userId}/threads`, {
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

async function publishContainer(
  creationId: string,
  creds: ThreadsCredentials
): Promise<string> {
  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: creds.accessToken,
  });

  const res = await fetch(`${BASE_URL}/${creds.userId}/threads_publish`, {
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

export async function postSingleThreadsPost(
  text: string,
  creds: ThreadsCredentials
): Promise<PostThreadsResponse> {
  try {
    const creationId = await createContainer(text, creds);
    const threadId = await publishContainer(creationId, creds);
    return { success: true, threadId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function postThreadsThread(
  tweets: string[],
  creds: ThreadsCredentials
): Promise<PostThreadsResponse> {
  try {
    let previousId: string | undefined;
    let firstId: string | undefined;

    for (const text of tweets) {
      const creationId = await createContainer(text, creds, previousId);
      const publishedId = await publishContainer(creationId, creds);
      if (!firstId) firstId = publishedId;
      previousId = publishedId;
    }

    return { success: true, threadId: firstId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
