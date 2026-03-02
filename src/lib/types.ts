export interface SubstackPost {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  content: string;
  author?: string;
}

export type TweetFormat = 'single' | 'thread';
export type TweetTone = 'casual' | 'professional' | 'witty' | 'inspirational';

export interface TweetVariant {
  id: string;
  format: TweetFormat;
  label: string;
  tweets: string[]; // single tweet = array of 1, thread = array of N
}

export interface GenerateRequest {
  post: SubstackPost;
  formats: TweetFormat[];
  tone: TweetTone;
  includeLink: boolean;
}

export interface GenerateResponse {
  variants: TweetVariant[];
  error?: string;
}

export interface PostTweetRequest {
  tweets: string[];
  format: TweetFormat;
}

export interface PostTweetResponse {
  success: boolean;
  tweetId?: string;
  error?: string;
}

export interface PostThreadsRequest {
  tweets: string[];
  format: TweetFormat;
}

export interface PostThreadsResponse {
  success: boolean;
  threadId?: string;
  error?: string;
}
