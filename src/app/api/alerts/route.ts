// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface AlertPayload {
  businessId: string;
  threshold?: number;
  windowMinutes?: number;
}

interface SentimentWindow {
  negativeCount: number;
  totalCount: number;
  negativeRatio: number;
  reviews: Array<{
    id: string;
    content: string;
    sentiment: string;
    sentimentScore: number;
    source: string;
    createdAt: Date;
  }>;
}

async function sendSlackNotification(
  webhookUrl: string,
  projectName: string,
  data: SentimentWindow,
  threshold: number
): Promise<void> {
  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🚨 ReviewRadar: Negative Sentiment Spike Detected",
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Project:*\n${projectName}`,
          },
          {
            type: "mrkdwn",
            text: `*Negative Rate:*\n${(data.negativeRatio * 100).toFixed(1)}% (threshold: ${threshold}%)`,
          },
          {
            type: "mrkdwn",
            text: `*Negative Reviews:*\n${data.negativeCount} of ${data.totalCount}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Recent Negative Reviews:*",
        },
      },
      ...data.reviews.slice(0, 3).map((review) => ({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `> ${review.content.slice(0, 200)}${review.content.length > 200 ? "..." : ""}\n_Source: ${review.source} | Score: ${review.sentimentScore.toFixed(2)}_`,
        },
      })),
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Dashboard" },
            url: `${process.env.NEXTAUTH_URL}/dashboard`,
            style: "danger",
          },
        ],
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack notification failed: ${response.statusText}`);
  }
}

async function sendEmailNotification(
  email: string,
  projectName: string,
  data: SentimentWindow,
  threshold: number
): Promise<void> {
  const reviewsHtml = data.reviews
    .slice(0, 5)
    .map(
      (review) => `
      <div style="border-left: 4px solid #ef4444; padding: 12px; margin-bottom: 12px; background: #fef2f2; border-radius: 4px;">
        <p style="margin: 0 0 8px; color: #374151;">${review.content.slice(0, 300)}${review.content.length > 300 ? "..." : ""}</p>
        <small style="color: #6b7280;">Source: ${review.source} | Sentiment Score: ${review.sentimentScore.toFixed(2)}</small>
      </div>
    `
    )
    .join("");

  await resend.emails.send({
    from: "ReviewRadar Alerts <alerts@reviewradar.app>",
    to: email,
    subject: `🚨 Negative Sentiment Spike in ${projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
              <h1 style="margin: 0; color: #111827; font-size: 24px;">🚨 Sentiment Alert</h1>
            </div>
            
            <p style="color: #374151;">A negative sentiment spike has been detected for <strong>${projectName}</strong>.</p>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Negative Rate</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #ef4444;">${(data.negativeRatio * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Your Threshold</td>
                  <td style="padding: 6px 0; font-weight: 600;">${threshold}%</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Negative Reviews</td>
                  <td style="padding: 6px 0; font-weight: 600;">${data.negativeCount} of ${data.totalCount}</td>
                </tr>
              </table>
            </div>
            
            <h3 style="color: #111827;">Recent Negative Reviews</h3>
            ${reviewsHtml}
            
            <div style="margin-top: 24px; text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Full Dashboard</a>
            </div>
            
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">ReviewRadar &bull; <a href="${process.env.NEXTAUTH_URL}/settings" style="color: #9ca3af;">Manage alert settings</a></p>
          </div>
        </body>
      </html>
    `,
  });
}

async function analyzeSentimentWindow(
  businessId: string,
  windowMinutes: number
): Promise<SentimentWindow> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const reviews = await prisma.review.findMany({
    where: {
      businessId,
      createdAt: { gte: since },
      sentimentScore: { isNot: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      sentimentScore: true,
      sentimentScore: true,
      source: true,
      createdAt: true,
    },
  });

  const negativeReviews = reviews.filter(
    (r) => r.sentimentScore === "NEGATIVE" && r.sentimentScore !== null
  ) as Array<{
    id: string;
    content: string;
    sentiment: string;
    sentimentScore: number;
    source: string;
    createdAt: Date;
  }>;

  return {
    negativeCount: negativeReviews.length,
    totalCount: reviews.length,
    negativeRatio: reviews.length > 0 ? negativeReviews.length / reviews.length : 0,
    reviews: negativeReviews,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AlertPayload = await request.json();
    const { businessId, threshold = 30, windowMinutes = 60 } = body;

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: businessId, userId: session.user.id },
      include: { user: { select: { email: true, name: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const sentimentData = await analyzeSentimentWindow(businessId, windowMinutes);

    if (sentimentData.totalCount < 5) {
      return NextResponse.json({
        triggered: false,
        reason: "Insufficient data (minimum 5 reviews required)",
        data: sentimentData,
      });
    }

    const negativePercent = sentimentData.negativeRatio * 100;
    const isSpike = negativePercent >= threshold;

    if (!isSpike) {
      return NextResponse.json({
        triggered: false,
        negativePercent: negativePercent.toFixed(1),
        threshold,
        data: sentimentData,
      });
    }

    const recentAlert = await prisma.alert.findFirst({
      where: {
        businessId,
        type: "NEGATIVE_SPIKE",
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    if (recentAlert) {
      return NextResponse.json({
        triggered: false,
        reason: "Alert already sent within the last hour",
        data: sentimentData,
      });
    }

    const alert = await prisma.alert.create({
      data: {
        businessId,
        type: "NEGATIVE_SPIKE",
        message: `Negative sentiment spike: ${negativePercent.toFixed(1)}% (${sentimentData.negativeCount}/${sentimentData.totalCount} reviews) in the last ${windowMinutes} minutes`,
        metadata: {
          negativePercent,
          threshold,
          windowMinutes,
          negativeCount: sentimentData.negativeCount,
          totalCount: sentimentData.totalCount,
        },
      },
    });

    const notifications: Array<Promise<void>> = [];

    if (project.user.email) {
      notifications.push(
        sendEmailNotification(
          project.user.email,
          project.name,
          sentimentData,
          threshold
        ).catch((err) => console.error("Email notification failed:", err))
      );
    }

    const slackWebhook = (project as any).slackWebhookUrl;
    if (slackWebhook) {
      notifications.push(
        sendSlackNotification(
          slackWebhook,
          project.name,
          sentimentData,
          threshold
        ).catch((err) => console.error("Slack notification failed:", err))
      );
    }

    await Promise.allSettled(notifications);

    return NextResponse.json({
      triggered: true,
      alertId: alert.id,
      negativePercent: negativePercent.toFixed(1),
      threshold,
      notificationsSent: {
        email: !!project.user.email,
        slack: !!slackWebhook,
      },
      data: {
        negativeCount: sentimentData.negativeCount,
        totalCount: sentimentData.totalCount,
        windowMinutes,
      },
    });
  } catch (error) {
    console.error("Alert API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);

    const whereClause = businessId
      ? {
          businessId,
          project: { userId: session.user.id },
        }
      : {
          project: { userId: session.user.id },
        };

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
      prisma.alert.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      alerts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get alerts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("id");

    if (!alertId) {
      return NextResponse.json({ error: "Alert ID is required" }, { status: 400 });
    }

    const alert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        project: { userId: session.user.id },
      },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    await prisma.alert.delete({ where: { id: alertId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete alert error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
