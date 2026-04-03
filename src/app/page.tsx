import Link from "next/link";
import { Check, Star, Zap, Shield, BarChart3, Bell, Globe, ArrowRight } from "lucide-react";

const features = [
  {
    icon: <BarChart3 className="h-6 w-6 text-indigo-500" />,
    title: "AI-Powered Sentiment Analysis",
    description: "GPT-4 analyzes every review to surface trends, recurring issues, and customer sentiment in real-time.",
  },
  {
    icon: <Bell className="h-6 w-6 text-indigo-500" />,
    title: "Instant Alerts",
    description: "Get notified immediately when a negative review hits. Respond before reputation damage spreads.",
  },
  {
    icon: <Globe className="h-6 w-6 text-indigo-500" />,
    title: "Multi-Platform Monitoring",
    description: "Track reviews across Google, Yelp, Trustpilot, G2, App Store, and more from one dashboard.",
  },
  {
    icon: <Zap className="h-6 w-6 text-indigo-500" />,
    title: "AI Response Drafts",
    description: "Generate on-brand, personalized response drafts in seconds — approve and publish with one click.",
  },
  {
    icon: <Shield className="h-6 w-6 text-indigo-500" />,
    title: "Reputation Score",
    description: "A unified score across all platforms so you always know where you stand at a glance.",
  },
  {
    icon: <Star className="h-6 w-6 text-indigo-500" />,
    title: "Review Request Campaigns",
    description: "Automatically ask happy customers for reviews via email campaigns powered by Resend.",
  },
];

const tiers = [
  {
    name: "Starter",
    price: 49,
    description: "Perfect for solo operators and small businesses just getting started.",
    features: [
      "Up to 3 locations / products",
      "5 review platforms",
      "Email alerts",
      "AI sentiment analysis",
      "Weekly digest reports",
      "5 AI response drafts / mo",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Growth",
    price: 99,
    description: "For growing teams that need deeper insights and faster response.",
    features: [
      "Up to 15 locations / products",
      "All review platforms",
      "Slack + email alerts",
      "Advanced AI analysis",
      "Daily digest reports",
      "Unlimited AI response drafts",
      "Review request campaigns",
      "Competitor benchmarking",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: 249,
    description: "For agencies and enterprises managing multiple brands at scale.",
    features: [
      "Unlimited locations / products",
      "All review platforms",
      "Priority Slack + email + SMS alerts",
      "Custom AI fine-tuning",
      "Real-time reports & API access",
      "Unlimited AI response drafts",
      "White-label dashboard",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Head of Marketing, NovaCoffee",
    avatar: "SC",
    quote:
      "ReviewRadar cut our response time from 48 hours to under 2 hours. Our average rating went from 3.8 to 4.6 stars in 90 days.",
  },
  {
    name: "Marcus Webb",
    role: "CEO, Stackline SaaS",
    avatar: "MW",
    quote:
      "The AI drafts save us hours every week. We just review and approve — it sounds exactly like us, not a bot.",
  },
  {
    name: "Priya Kapoor",
    role: "Operations Manager, UrbanStay Hotels",
    avatar: "PK",
    quote:
      "Managing reviews across 12 hotel properties used to be a nightmare. ReviewRadar centralizes everything beautifully.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Star className="h-4 w-4 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ReviewRadar</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900">
              Testimonials
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-6 pb-24 pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
            <Zap className="h-3.5 w-3.5" />
            Powered by GPT-4 · Loved by 2,400+ businesses
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Never miss a review.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Always respond fast.
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl">
            ReviewRadar monitors your reviews across every platform, analyzes sentiment with AI, and
            helps you respond in minutes — not days. Protect your reputation on autopilot.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-105"
            >
              Start 14-day free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#pricing"
              className="rounded-xl border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:border-gray-400 transition-colors"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">No credit card required · Cancel anytime</p>
        </div>

        {/* Hero dashboard mockup */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-indigo-100">
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-400">app.reviewradar.io/dashboard</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-6">
              {[
                { label: "Avg. Rating", value: "4.7", change: "+0.3", color: "text-green-600" },
                { label: "Reviews This Month", value: "284", change: "+42", color: "text-green-600" },
                { label: "Response Rate", value: "94%", change: "+18%", color: "text-green-600" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`mt-1 text-xs font-semibold ${stat.color}`}>{stat.change} this month</p>
                </div>
              ))}
            </div>
            <div className="mx-6 mb-6 space-y-3">
              {[
                { platform: "Google", rating: 5, text: "Absolutely fantastic service. Will definitely be back!", time: "2m ago", badge: "Positive" },
                { platform: "Yelp", rating: 2, text: "Waited 45 minutes. Staff was unresponsive to complaints.", time: "15m ago", badge: "Needs Response" },
                { platform: "Trustpilot", rating: 4, text: "Great product, shipping could be faster though.", time: "1h ago", badge: "Positive" },
              ].map((review) => (
                <div key={review.text} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {review.platform[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">{review.platform}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating ? "text-yellow-400" : "text-gray-200"
                            }`}
                            fill={i < review.rating ? "currentColor" : "currentColor"}
                          />
                        ))}
                      </div>
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                          review.badge === "Needs Response"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {review.badge}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-600">{review.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social proof logos */}
      <section className="border-y border-gray-100 bg-gray-50 py-10">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-6 text-center text-sm font-medium text-gray-400">TRUSTED BY TEAMS AT</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {["NovaCoffee", "UrbanStay", "Stackline", "PetalHealth", "QuickServe", "BrightFit"].map(
              (brand) => (
                <span key={brand} className="text-lg font-bold text-gray-300">
                  {brand}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900">Everything you need to win on reputation</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              ReviewRadar combines monitoring, AI analysis, and automated outreach into one intuitive platform.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-600">14-day free trial on all plans. No credit card required.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border p-8 shadow-sm ${
                  tier.highlighted
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                    : "border-gray-200 bg-white"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1 text-xs font-bold text-white shadow">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <h3
                    className={`mb-1 text-xl font-bold ${
                      tier.highlighted ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {tier.name}
                  </h3>
                  <p
                    className={`mb-4 text-sm ${
                      tier.highlighted ? "text-indigo-200" : "text-gray-500"
                    }`}
                  >
                    {tier.description}
                  </p>
                  <div className="flex items-end gap-1">
                    <span
                      className={`text-5xl font-extrabold ${
                        tier.highlighted ? "text-white" : "text-gray-900"
                      }`}
                    >
                      ${tier.price}
                    </span>
                    <span
                      className={`mb-1 text-sm ${
                        tier.highlighted ? "text-indigo-200" : "text-gray-500"
                      }`}
                    >
                      /month
                    </span>
                  </div>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          tier.highlighted ? "text-indigo-300" : "text-indigo-500"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          tier.highlighted ? "text-indigo-100" : "text-gray-600"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.name === "Enterprise" ? "/contact" : "/auth/signup"}
                  className={`block rounded-xl py-3 text-center text-sm font-semibold transition-all hover:scale-105 ${
                    tier.highlighted
                      ? "bg-white text-indigo-600 hover:bg-indigo-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-500">
            All prices in USD. Annual billing saves 20%.{" "}
            <Link href="/pricing" className="font-medium text-indigo-600 hover:underline">
              See full comparison →
            </Link>
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900">What our customers say</h2>
            <p className="text-lg text-gray-600">Real results from real businesses using ReviewRadar.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-gray-700">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-4xl font-extrabold text-white">Start protecting your reputation today</h2>
          <p className="mb-8 text-lg text-indigo-200">
            Join 2,400+ businesses that use ReviewRadar to monitor, analyze, and respond to reviews at scale.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 shadow-lg hover:bg-indigo-50 transition-all hover:scale-105"
            >
              Start your free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-indigo-400 px-8 py-4 text-base font-semibold text-white hover:border-white transition-colors"
            >
              Talk to sales
            </Link>
          </div>
          <p className="mt-4 text-sm text-indigo-300">14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
                <Star className="h-3.5 w-3.5 text-white" fill="white" />
              </div>
              <span className="font-bold text-gray-900">ReviewRadar</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-gray-900">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-gray-900">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-gray-900">
                Contact
              </Link>
              <Link href="/blog" className="hover:text-gray-900">
                Blog
              </Link>
            </div>
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} ReviewRadar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
