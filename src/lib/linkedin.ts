import { PostLinkedInResponse } from './types';

const { LINKEDIN_ACCESS_TOKEN, LINKEDIN_PERSON_URN } = process.env;

const BASE_URL = 'https://api.linkedin.com/rest';
const LINKEDIN_VERSION = '202601';

export const isLinkedInConfigured = Boolean(LINKEDIN_ACCESS_TOKEN && LINKEDIN_PERSON_URN);

async function createPost(text: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'Linkedin-Version': LINKEDIN_VERSION,
    },
    body: JSON.stringify({
      author: LINKEDIN_PERSON_URN,
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

  // LinkedIn returns the post URN in the response header, not the body
  const postId = res.headers.get('x-restli-id') ?? 'unknown';
  return postId;
}

export async function postToLinkedIn(text: string): Promise<PostLinkedInResponse> {
  if (!isLinkedInConfigured) {
    return { success: false, error: 'LinkedIn API not configured' };
  }
  try {
    const postId = await createPost(text);
    return { success: true, postId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
