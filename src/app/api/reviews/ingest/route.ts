// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const IngestSchema = z.object({
  businessId: z.string().min(1),
  platforms: z
    .array(z.enum(['google', 'yelp', 'g2', 'trustpilot', 'appstore']))
    .min(1),
});

type Platform = 'google' | 'yelp' | 'g2' | 'trustpilot' | 'appstore';

interface RawReview {
  externalId: string;
  platform: Platform;
  author: string;
  rating: number;
  title?: string;
  body: string;
  publishedAt: Date;
  url?: string;
  avatarUrl?: string;
  verified?: boolean;
}

/* ------------------------------------------------------------------ */
/* Platform fetchers (stubs → replace with real SDK / API calls)       */
/* ------------------------------------------------------------------ */

async function fetchGoogleReviews(config: Record<string, string>): Promise<RawReview[]> {
  const placeId = config.googlePlaceId;
  if (!placeId) return [];

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${process.env.GOOGLE_PLACES_API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Google Places API error: ${res.status}`);

  const data = await res.json();
  const reviews: RawReview[] = (data.result?.reviews ?? []).map((r: any, i: number) => ({
    externalId: `google-${placeId}-${i}-${r.time}`,
    platform: 'google' as Platform,
    author: r.author_name,
    rating: r.rating,
    body: r.text,
    publishedAt: new Date(r.time * 1000),
    url: r.author_url,
    avatarUrl: r.profile_photo_url,
    verified: false,
  }));
  return reviews;
}

async function fetchYelpReviews(config: Record<string, string>): Promise<RawReview[]> {
  const businessId = config.yelpBusinessId;
  if (!businessId) return [];

  const res = await fetch(`https://api.yelp.com/v3/businesses/${businessId}/reviews?limit=50`, {
    headers: { Authorization: `Bearer ${process.env.YELP_API_KEY}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Yelp API error: ${res.status}`);

  const data = await res.json();
  return (data.reviews ?? []).map((r: any) => ({
    externalId: r.id,
    platform: 'yelp' as Platform,
    author: r.user?.name ?? 'Anonymous',
    rating: r.rating,
    body: r.text,
    publishedAt: new Date(r.time_created),
    url: r.url,
    avatarUrl: r.user?.image_url,
    verified: false,
  }));
}

async function fetchG2Reviews(config: Record<string, string>): Promise<RawReview[]> {
  const productId = config.g2ProductId;
  if (!productId) return [];

  // G2 offers a private API; using their public JSON feed as fallback
  const res = await fetch(
    `https://www.g2.com/products/${productId}/reviews.json?per_page=100`,
    {
      headers: {
        Authorization: `Token token=${process.env.G2_API_KEY}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    },
  );
  if (!res.ok) throw new Error(`G2 API error: ${res.status}`);

  const data = await res.json();
  return (data.reviews ?? []).map((r: any) => ({
    externalId: r.id.toString(),
    platform: 'g2' as Platform,
    author: r.reviewer?.name ?? 'G2 User',
    rating: Math.round((r.star_rating ?? 0) / 20), // G2 uses 0-100
    title: r.title,
    body: r.body ?? '',
    publishedAt: new Date(r.submitted_at),
    url: `https://www.g2.com/reviews/${r.id}`,
    verified: r.verified ?? false,
  }));
}

async function fetchTrustpilotReviews(config: Record<string, string>): Promise<RawReview[]> {
  const businessUnitId = config.trustpilotBusinessUnitId;
  if (!businessUnitId) return [];

  const tokenRes = await fetch('https://api.trustpilot.com/v1/oauth/oauth-business-users-for-business/accesstoken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      username: process.env.TRUSTPILOT_USERNAME ?? '',
      password: process.env.TRUSTPILOT_PASSWORD ?? '',
      client_id: process.env.TRUSTPILOT_API_KEY ?? '',
      client_secret: process.env.TRUSTPILOT_API_SECRET ?? '',
    }),
  });

  let headers: Record<string, string> = { apikey: process.env.TRUSTPILOT_API_KEY ?? '' };
  if (tokenRes.ok) {
    const t = await tokenRes.json();
    headers = { Authorization: `Bearer ${t.access_token}` };
  }

  const res = await fetch(
    `https://api.trustpilot.com/v1/private/business-units/${businessUnitId}/reviews?perPage=100`,
    { headers, next: { revalidate: 0 } },
  );
  if (!res.ok) throw new Error(`Trustpilot API error: ${res.status}`);

  const data = await res.json();
  return (data.reviews ?? []).map((r: any) => ({
    externalId: r.id,
    platform: 'trustpilot' as Platform,
    author: `${r.consumer?.displayName ?? 'Trustpilot User'}`,
    rating: r.stars,
    title: r.title,
    body: r.text,
    publishedAt: new Date(r.createdAt),
    url: `https://www.trustpilot.com/reviews/${r.id}`,
    verified: r.isVerified ?? false,
  }));
}

async function fetchAppStoreReviews(config: Record<string, string>): Promise<RawReview[]> {
  const appId = config.appStoreAppId;
  if (!appId) return [];

  const country = config.appStoreCountry ?? 'us';
  const res = await fetch(
    `https://itunes.apple.com/${country}/rss/customerreviews/page=1/id=${appId}/sortby=mostrecent/json`,
    { next: { revalidate: 0 } },
  );
  if (!res.ok) throw new Error(`App Store RSS error: ${res.status}`);

  const data = await res.json();
  const entries: any[] = data.feed?.entry ?? [];
  // First entry is app metadata, skip it
  return entries.slice(1).map((e: any) => ({
    externalId: e.id?.label ?? `appstore-${appId}-${Math.random()}`,
    platform: 'appstore' as Platform,
    author: e.author?.name?.label ?? 'App Store User',
    rating: parseInt(e['im:rating']?.label ?? '0', 10),
    title: e.title?.label,
    body: e.content?.label ?? '',
    publishedAt: new Date(e.updated?.label),
    verified: false,
  }));
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                           */
/* ------------------------------------------------------------------ */

async function fetchPlatformReviews(
  platform: Platform,
  config: Record<string, string>,
): Promise<{ reviews: RawReview[]; error?: string }> {
  try {
    let reviews: RawReview[] = [];
    switch (platform) {
      case 'google':
        reviews = await fetchGoogleReviews(config);
        break;
      case 'yelp':
        reviews = await fetchYelpReviews(config);
        break;
      case 'g2':
        reviews = await fetchG2Reviews(config);
        break;
      case 'trustpilot':
        reviews = await fetchTrustpilotReviews(config);
        break;
      case 'appstore':
        reviews = await fetchAppStoreReviews(config);
        break;
    }
    return { reviews };
  } catch (err: any) {
    console.error(`[ingest] ${platform} error:`, err);
    return { reviews: [], error: err.message ?? String(err) };
  }
}

/* ------------------------------------------------------------------ */
/* Upsert reviews into Prisma                                           */
/* ------------------------------------------------------------------ */

async function upsertReviews(businessId: string, reviews: RawReview[]) {
  const results = await Promise.allSettled(
    reviews.map((r) =>
      prisma.review.upsert({
        where: { externalId: r.externalId },
        create: {
          externalId: r.externalId,
          platform: r.platform,
          author: r.author,
          rating: r.rating,
          title: r.title ?? null,
          body: r.body,
          publishedAt: r.publishedAt,
          url: r.url ?? null,
          avatarUrl: r.avatarUrl ?? null,
          verified: r.verified ?? false,
          businessId,
          sentiment: null,
          sentimentScore: null,
          tags: [],
          replied: false,
          replyText: null,
          replyAt: null,
        },
        update: {
          author: r.author,
          rating: r.rating,
          title: r.title ?? null,
          body: r.body,
          publishedAt: r.publishedAt,
          url: r.url ?? null,
          avatarUrl: r.avatarUrl ?? null,
          verified: r.verified ?? false,
        },
      }),
    ),
  );

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      // Prisma upsert doesn't tell us created vs updated directly;
      // we just count successes
      created++;
    } else {
      failed++;
      console.error('[ingest] upsert error:', result.reason);
    }
  }

  return { created, updated, failed };
}

/* ------------------------------------------------------------------ */
/* Route handler                                                        */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = IngestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { businessId, platforms } = parsed.data;

    // Verify the business belongs to the user
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: session.user.id },
      select: { id: true, platformConfig: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const config = (business.platformConfig as Record<string, string>) ?? {};

    // Fetch all requested platforms concurrently
    const platformResults = await Promise.all(
      platforms.map(async (platform) => {
        const { reviews, error } = await fetchPlatformReviews(platform, config);
        return { platform, reviews, error };
      }),
    );

    // Combine all reviews
    const allReviews = platformResults.flatMap((r) => r.reviews);
    const platformErrors = platformResults
      .filter((r) => r.error)
      .map((r) => ({ platform: r.platform, error: r.error }));

    // Upsert into DB
    const { created, updated, failed } = await upsertReviews(businessId, allReviews);

    // Update last sync timestamp
    await prisma.business.update({
      where: { id: businessId },
      data: { lastSyncedAt: new Date() },
    });

    // Enqueue sentiment analysis job (fire and forget)
    if (allReviews.length > 0) {
      fetch(`${process.env.NEXTAUTH_URL}/api/reviews/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '' },
        body: JSON.stringify({ businessId }),
      }).catch((e) => console.error('[ingest] analyze enqueue error:', e));
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalFetched: allReviews.length,
        upserted: created,
        failed,
        platformBreakdown: platformResults.map((r) => ({
          platform: r.platform,
          count: r.reviews.length,
          error: r.error ?? null,
        })),
      },
      errors: platformErrors.length > 0 ? platformErrors : undefined,
    });
  } catch (err: any) {
    console.error('[ingest] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow CRON / internal services to trigger ingestion
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret');
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');

  try {
    const businesses = businessId
      ? await prisma.business.findMany({ where: { id: businessId }, select: { id: true, platformConfig: true, activePlatforms: true } })
      : await prisma.business.findMany({ select: { id: true, platformConfig: true, activePlatforms: true } });

    const results = await Promise.allSettled(
      businesses.map(async (biz) => {
        const config = (biz.platformConfig as Record<string, string>) ?? {};
        const platforms = ((biz.activePlatforms as string[]) ?? []) as Platform[];
        if (platforms.length === 0) return { businessId: biz.id, skipped: true };

        const platformResults = await Promise.all(
          platforms.map((p) => fetchPlatformReviews(p, config)),
        );
        const allReviews = platformResults.flatMap((r) => r.reviews);
        const stats = await upsertReviews(biz.id, allReviews);

        await prisma.business.update({ where: { id: biz.id }, data: { lastSyncedAt: new Date() } });

        return { businessId: biz.id, fetched: allReviews.length, ...stats };
      }),
    );

    return NextResponse.json({
      success: true,
      processed: businesses.length,
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { error: String((r as any).reason) },
      ),
    });
  } catch (err: any) {
    console.error('[ingest][cron] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
