// @ts-nocheck
import { Platform } from '@prisma/client';

export interface ReviewData {
  externalId: string;
  platform: Platform;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  title?: string;
  content: string;
  publishedAt: Date;
  url?: string;
  verified?: boolean;
  helpfulCount?: number;
  language?: string;
  response?: {
    content: string;
    publishedAt: Date;
  };
}

export interface IntegrationConfig {
  accessToken?: string;
  apiKey?: string;
  accountId?: string;
  businessId?: string;
  appId?: string;
  businessId?: string;
}

export interface FetchReviewsOptions {
  pageToken?: string;
  limit?: number;
  since?: Date;
}

export interface FetchReviewsResult {
  reviews: ReviewData[];
  nextPageToken?: string;
  totalCount?: number;
}

// ─── Google Business Profile ────────────────────────────────────────────────

async function fetchGoogleReviews(
  config: IntegrationConfig,
  opts: FetchReviewsOptions = {}
): Promise<FetchReviewsResult> {
  const { accessToken, accountId, businessId } = config;
  if (!accessToken || !accountId || !businessId) {
    throw new Error('Google Business Profile requires accessToken, accountId, and businessId');
  }

  const base = 'https://mybusiness.googleapis.com/v4';
  const params = new URLSearchParams();
  if (opts.pageToken) params.set('pageToken', opts.pageToken);
  if (opts.limit) params.set('pageSize', String(Math.min(opts.limit, 50)));

  const url = `${base}/accounts/${accountId}/locations/${businessId}/reviews?${params}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const reviews: ReviewData[] = (data.reviews ?? []).map((r: any) => ({
    externalId: r.reviewId,
    platform: 'GOOGLE' as Platform,
    authorName: r.reviewer?.displayName ?? 'Anonymous',
    authorAvatar: r.reviewer?.profilePhotoUrl,
    rating: starRatingToNumber(r.starRating),
    content: r.comment ?? '',
    publishedAt: new Date(r.createTime),
    url: r.reviewReplyUrl,
    verified: false,
    response: r.reviewReply
      ? { content: r.reviewReply.comment, publishedAt: new Date(r.reviewReply.updateTime) }
      : undefined,
  }));

  return { reviews, nextPageToken: data.nextPageToken, totalCount: data.totalReviewCount };
}

function starRatingToNumber(star: string): number {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return map[star] ?? 0;
}

async function postGoogleReply(
  config: IntegrationConfig,
  reviewId: string,
  replyText: string
): Promise<void> {
  const { accessToken, accountId, businessId } = config;
  if (!accessToken || !accountId || !businessId) {
    throw new Error('Google Business Profile requires accessToken, accountId, and businessId');
  }

  const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${businessId}/reviews/${reviewId}/reply`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment: replyText }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google reply error ${res.status}: ${err}`);
  }
}

// ─── Yelp Fusion ────────────────────────────────────────────────────────────

async function fetchYelpReviews(
  config: IntegrationConfig,
  opts: FetchReviewsOptions = {}
): Promise<FetchReviewsResult> {
  const { apiKey, businessId } = config;
  if (!apiKey || !businessId) {
    throw new Error('Yelp Fusion requires apiKey and businessId');
  }

  const limit = Math.min(opts.limit ?? 20, 50);
  const offset = opts.pageToken ? parseInt(opts.pageToken, 10) : 0;

  const url = `https://api.yelp.com/v3/businesses/${businessId}/reviews?limit=${limit}&offset=${offset}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Yelp API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const reviews: ReviewData[] = (data.reviews ?? []).map((r: any) => ({
    externalId: r.id,
    platform: 'YELP' as Platform,
    authorName: r.user?.name ?? 'Anonymous',
    authorAvatar: r.user?.image_url,
    rating: r.rating,
    content: r.text ?? '',
    publishedAt: new Date(r.time_created),
    url: r.url,
    verified: false,
  }));

  const newOffset = offset + reviews.length;
  const nextPageToken = newOffset < data.total ? String(newOffset) : undefined;

  return { reviews, nextPageToken, totalCount: data.total };
}

async function fetchYelpBusinessInfo(config: IntegrationConfig) {
  const { apiKey, businessId } = config;
  if (!apiKey || !businessId) throw new Error('Yelp Fusion requires apiKey and businessId');

  const res = await fetch(`https://api.yelp.com/v3/businesses/${businessId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) throw new Error(`Yelp business info error ${res.status}`);
  return res.json();
}

// ─── Trustpilot ─────────────────────────────────────────────────────────────

async function fetchTrustpilotToken(apiKey: string, apiSecret: string): Promise<string> {
  const creds = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const res = await fetch('https://api.trustpilot.com/v1/oauth/oauth-business-users-for-claims/accesstoken', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`Trustpilot auth error ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function fetchTrustpilotReviews(
  config: IntegrationConfig,
  opts: FetchReviewsOptions = {}
): Promise<FetchReviewsResult> {
  const { apiKey, businessId, accessToken } = config;
  if (!businessId) throw new Error('Trustpilot requires businessId');

  const token = accessToken ?? (apiKey ? await fetchTrustpilotToken(apiKey, '') : null);
  if (!token) throw new Error('Trustpilot requires accessToken or apiKey');

  const params = new URLSearchParams({
    perPage: String(Math.min(opts.limit ?? 20, 100)),
  });
  if (opts.pageToken) params.set('page', opts.pageToken);
  if (opts.since) params.set('startDateTime', opts.since.toISOString());

  const url = `https://api.trustpilot.com/v1/private/business-units/${businessId}/reviews?${params}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Trustpilot API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const reviews: ReviewData[] = (data.reviews ?? []).map((r: any) => ({
    externalId: r.id,
    platform: 'TRUSTPILOT' as Platform,
    authorName: r.consumer?.displayName ?? 'Anonymous',
    authorAvatar: r.consumer?.imageUrl,
    rating: r.stars,
    title: r.title,
    content: r.text ?? '',
    publishedAt: new Date(r.createdAt),
    url: r.links?.find((l: any) => l.rel === 'self')?.href,
    verified: r.verified ?? false,
    language: r.language,
    response: r.reply
      ? { content: r.reply.message, publishedAt: new Date(r.reply.createdAt) }
      : undefined,
  }));

  const page = data.links?.find((l: any) => l.rel === 'next-page');
  return { reviews, nextPageToken: page ? String((parseInt(opts.pageToken ?? '1', 10)) + 1) : undefined, totalCount: data.pagination?.total };
}

async function postTrustpilotReply(
  config: IntegrationConfig,
  reviewId: string,
  replyText: string
): Promise<void> {
  const { accessToken, businessId } = config;
  if (!accessToken || !businessId) throw new Error('Trustpilot reply requires accessToken and businessId');

  const url = `https://api.trustpilot.com/v1/private/reviews/${reviewId}/reply`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: replyText }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Trustpilot reply error ${res.status}: ${err}`);
  }
}

// ─── G2 ─────────────────────────────────────────────────────────────────────

async function fetchG2Reviews(
  config: IntegrationConfig,
  opts: FetchReviewsOptions = {}
): Promise<FetchReviewsResult> {
  const { apiKey, businessId } = config;
  if (!apiKey) throw new Error('G2 requires apiKey');

  const params = new URLSearchParams({
    'page[size]': String(Math.min(opts.limit ?? 20, 100)),
  });
  if (opts.pageToken) params.set('page[number]', opts.pageToken);
  if (businessId) params.set('filter[product_id]', businessId);
  if (opts.since) params.set('filter[submitted_after]', opts.since.toISOString());

  const url = `https://data.g2.com/api/v1/reviews?${params}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Token token=${apiKey}`,
      'Content-Type': 'application/vnd.api+json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`G2 API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const reviews: ReviewData[] = (data.data ?? []).map((r: any) => {
    const attrs = r.attributes ?? {};
    return {
      externalId: r.id,
      platform: 'G2' as Platform,
      authorName: attrs.reviewer_name ?? 'Anonymous',
      rating: Math.round((attrs.star_rating ?? 0) / 2),
      title: attrs.title,
      content: [attrs.love, attrs.hate, attrs.benefits].filter(Boolean).join('\n\n'),
      publishedAt: new Date(attrs.submitted_at ?? attrs.created_at),
      url: attrs.product_url,
      verified: attrs.verified_current_user ?? false,
      language: attrs.comment_answers?.language,
    };
  });

  const meta = data.meta?.pagination ?? {};
  const currentPage = parseInt(opts.pageToken ?? '1', 10);
  const nextPageToken = currentPage < (meta.pages ?? 1) ? String(currentPage + 1) : undefined;

  return { reviews, nextPageToken, totalCount: meta.total_records };
}

// ─── Apple App Store ─────────────────────────────────────────────────────────

async function fetchAppStoreReviews(
  config: IntegrationConfig,
  opts: FetchReviewsOptions = {}
): Promise<FetchReviewsResult> {
  const { appId } = config;
  if (!appId) throw new Error('Apple App Store requires appId');

  const page = opts.pageToken ? parseInt(opts.pageToken, 10) : 1;
  const url = `https://itunes.apple.com/us/rss/customerreviews/page=${page}/id=${appId}/sortBy=mostRecent/json`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'ReviewRadar/1.0' },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`App Store API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const entries: any[] = data.feed?.entry ?? [];

  // First entry is app metadata, skip it
  const reviewEntries = entries.filter((e: any) => e['im:rating']);

  const reviews: ReviewData[] = reviewEntries
    .map((r: any) => {
      const publishedAt = new Date(r.updated?.label);
      if (opts.since && publishedAt < opts.since) return null;
      return {
        externalId: r.id?.label ?? String(Math.random()),
        platform: 'APPLE_APP_STORE' as Platform,
        authorName: r.author?.name?.label ?? 'Anonymous',
        rating: parseInt(r['im:rating']?.label ?? '0', 10),
        title: r.title?.label,
        content: r.content?.label ?? '',
        publishedAt,
        verified: false,
        language: 'en',
      };
    })
    .filter(Boolean) as ReviewData[];

  const links: any[] = data.feed?.link ?? [];
  const hasNext = links.some((l: any) => l.attributes?.rel === 'next');
  const nextPageToken = hasNext ? String(page + 1) : undefined;

  return { reviews, nextPageToken };
}

// ─── Unified Client ──────────────────────────────────────────────────────────

export async function fetchReviews(
  platform: Platform,
  config: IntegrationConfig,
  opts: FetchReviewsOptions = {}
): Promise<FetchReviewsResult> {
  switch (platform) {
    case 'GOOGLE':
      return fetchGoogleReviews(config, opts);
    case 'YELP':
      return fetchYelpReviews(config, opts);
    case 'TRUSTPILOT':
      return fetchTrustpilotReviews(config, opts);
    case 'G2':
      return fetchG2Reviews(config, opts);
    case 'APPLE_APP_STORE':
      return fetchAppStoreReviews(config, opts);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

export async function postReply(
  platform: Platform,
  config: IntegrationConfig,
  reviewId: string,
  replyText: string
): Promise<void> {
  switch (platform) {
    case 'GOOGLE':
      return postGoogleReply(config, reviewId, replyText);
    case 'TRUSTPILOT':
      return postTrustpilotReply(config, reviewId, replyText);
    case 'YELP':
    case 'G2':
    case 'APPLE_APP_STORE':
      throw new Error(`Reply not supported for platform: ${platform}`);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

export async function fetchAllReviews(
  platform: Platform,
  config: IntegrationConfig,
  since?: Date
): Promise<ReviewData[]> {
  const all: ReviewData[] = [];
  let pageToken: string | undefined;
  let page = 0;
  const MAX_PAGES = 20;

  do {
    const result = await fetchReviews(platform, config, { pageToken, limit: 50, since });
    all.push(...result.reviews);
    pageToken = result.nextPageToken;
    page++;
  } while (pageToken && page < MAX_PAGES);

  return all;
}

export function getPlatformDisplayName(platform: Platform): string {
  const names: Record<Platform, string> = {
    GOOGLE: 'Google Business Profile',
    YELP: 'Yelp',
    TRUSTPILOT: 'Trustpilot',
    G2: 'G2',
    APPLE_APP_STORE: 'Apple App Store',
    GOOGLE_PLAY: 'Google Play Store',
    FACEBOOK: 'Facebook',
    TRIPADVISOR: 'TripAdvisor',
    AMAZON: 'Amazon',
    CUSTOM: 'Custom',
  };
  return names[platform] ?? platform;
}

export function getPlatformLogoUrl(platform: Platform): string {
  const logos: Record<Platform, string> = {
    GOOGLE: '/logos/google.svg',
    YELP: '/logos/yelp.svg',
    TRUSTPILOT: '/logos/trustpilot.svg',
    G2: '/logos/g2.svg',
    APPLE_APP_STORE: '/logos/apple.svg',
    GOOGLE_PLAY: '/logos/google-play.svg',
    FACEBOOK: '/logos/facebook.svg',
    TRIPADVISOR: '/logos/tripadvisor.svg',
    AMAZON: '/logos/amazon.svg',
    CUSTOM: '/logos/custom.svg',
  };
  return logos[platform] ?? '/logos/default.svg';
}

export function supportsReply(platform: Platform): boolean {
  return ['GOOGLE', 'TRUSTPILOT'].includes(platform);
}

export function getRequiredConfigFields(platform: Platform): string[] {
  const fields: Record<Platform, string[]> = {
    GOOGLE: ['accessToken', 'accountId', 'businessId'],
    YELP: ['apiKey', 'businessId'],
    TRUSTPILOT: ['accessToken', 'businessId'],
    G2: ['apiKey', 'businessId'],
    APPLE_APP_STORE: ['appId'],
    GOOGLE_PLAY: ['accessToken', 'appId'],
    FACEBOOK: ['accessToken', 'businessId'],
    TRIPADVISOR: ['apiKey', 'businessId'],
    AMAZON: ['accessToken', 'businessId'],
    CUSTOM: [],
  };
  return fields[platform] ?? [];
}
