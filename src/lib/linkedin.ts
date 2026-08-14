import { PostLinkedInResponse } from './types';

const BASE_URL = 'https://api.linkedin.com/rest';
const LINKEDIN_VERSION = '202601';

export interface LinkedInCredentials {
  accessToken: string;
  personUrn: string;
}

async function createPost(text: string, creds: LinkedInCredentials): Promise<string> {
  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'Linkedin-Version': LINKEDIN_VERSION,
    },
    body: JSON.stringify({
      author: creds.personUrn,
      commentary: text,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Post creation failed (${res.status})`);
  }

  const postId = res.headers.get('x-restli-id') ?? 'unknown';
  return postId;
}

export async function postToLinkedIn(
  text: string,
  creds: LinkedInCredentials
): Promise<PostLinkedInResponse> {
  try {
    const postId = await createPost(text, creds);
    return { success: true, postId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
