import React, { useState } from "react";
import {
  Copy,
  Share2,
  TrendingUp,
  Users,
  DollarSign,
  Gift,
  Twitter,
  Linkedin,
  Mail,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  commissionRate: number;
  payoutStatus: "pending" | "processing" | "completed";
  nextPayoutDate: string;
}

interface Referral {
  id: string;
  referredEmail: string;
  status: "pending" | "active" | "churned";
  signupDate: string;
  subscription: string;
  monthlyValue: number;
  commission: number;
  commissionStatus: "pending" | "earned" | "paid";
}

interface ReferralLeaderboardEntry {
  rank: number;
  name: string;
  referrals: number;
  earnings: number;
  avatar: string;
}

const MOCK_REFERRAL_DATA: ReferralData = {
  referralCode: "APPSTUDIO_USER_123",
  referralLink: "https://appstudio.com/ref/APPSTUDIO_USER_123",
  totalReferrals: 12,
  activeReferrals: 10,
  totalEarnings: 2840,
  pendingEarnings: 580,
  commissionRate: 20,
  payoutStatus: "pending",
  nextPayoutDate: "2026-06-01",
};

const MOCK_REFERRALS: Referral[] = [
  {
    id: "ref_1",
    referredEmail: "john@example.com",
    status: "active",
    signupDate: "2026-04-15",
    subscription: "Professional",
    monthlyValue: 99,
    commission: 19.8,
    commissionStatus: "earned",
  },
  {
    id: "ref_2",
    referredEmail: "sarah@example.com",
    status: "active",
    signupDate: "2026-04-10",
    subscription: "Starter",
    monthlyValue: 29,
    commission: 5.8,
    commissionStatus: "earned",
  },
  {
    id: "ref_3",
    referredEmail: "mike@example.com",
    status: "pending",
    signupDate: "2026-05-01",
    subscription: "Basic",
    monthlyValue: 3.99,
    commission: 0.8,
    commissionStatus: "pending",
  },
  {
    id: "ref_4",
    referredEmail: "lisa@example.com",
    status: "active",
    signupDate: "2026-03-20",
    subscription: "Professional",
    monthlyValue: 99,
    commission: 19.8,
    commissionStatus: "paid",
  },
];

const MOCK_LEADERBOARD: ReferralLeaderboardEntry[] = [
  { rank: 1, name: "Alex Chen", referrals: 45, earnings: 8920, avatar: "AC" },
  { rank: 2, name: "Jordan Smith", referrals: 38, earnings: 7240, avatar: "JS" },
  { rank: 3, name: "You", referrals: 12, earnings: 2840, avatar: "YOU" },
  { rank: 4, name: "Emma Wilson", referrals: 8, earnings: 1560, avatar: "EW" },
  { rank: 5, name: "David Brown", referrals: 6, earnings: 1180, avatar: "DB" },
];

export function ReferralRewardsDashboard() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "referrals" | "leaderboard">(
    "overview"
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(MOCK_REFERRAL_DATA.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const text = `Join AppStudio and get 20% commission on every referral! Use my link: ${MOCK_REFERRAL_DATA.referralLink}`;
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(MOCK_REFERRAL_DATA.referralLink)}`,
      email: `mailto:?subject=Join AppStudio&body=${encodeURIComponent(text)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Referral Rewards</h2>
          <p className="text-muted-foreground">Earn 20% commission on every referral</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Referral Code</p>
          <p className="text-2xl font-bold text-violet-600">{MOCK_REFERRAL_DATA.referralCode}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Referrals</p>
              <p className="text-3xl font-bold">{MOCK_REFERRAL_DATA.totalReferrals}</p>
              <p className="text-xs text-green-600 mt-2">
                {MOCK_REFERRAL_DATA.activeReferrals} active
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
              <p className="text-3xl font-bold">${MOCK_REFERRAL_DATA.totalEarnings}</p>
              <p className="text-xs text-muted-foreground mt-2">All time</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending Earnings</p>
              <p className="text-3xl font-bold">${MOCK_REFERRAL_DATA.pendingEarnings}</p>
              <p className="text-xs text-yellow-600 mt-2">
                Payout {MOCK_REFERRAL_DATA.nextPayoutDate}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Commission Rate</p>
              <p className="text-3xl font-bold">{MOCK_REFERRAL_DATA.commissionRate}%</p>
              <p className="text-xs text-muted-foreground mt-2">Per referral</p>
            </div>
            <Gift className="h-8 w-8 text-purple-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card className="p-6 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border-violet-500/20">
        <h3 className="font-semibold mb-4">Share Your Referral Link</h3>
        <div className="flex gap-2 mb-6">
          <Input
            value={MOCK_REFERRAL_DATA.referralLink}
            readOnly
            className="flex-1"
          />
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">Share on social media:</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("twitter")}
            className="gap-2"
          >
            <Twitter className="h-4 w-4" />
            Twitter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("linkedin")}
            className="gap-2"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("email")}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        {["overview", "referrals", "leaderboard"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? "text-foreground border-b-2 border-violet-600 -mb-[2px]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Commission Breakdown */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Commission Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Basic Plan Referrals</span>
                <span className="font-semibold">$15.96</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Starter Plan Referrals</span>
                <span className="font-semibold">$87.40</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Professional Plan Referrals</span>
                <span className="font-semibold">$1,980.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Enterprise Plan Referrals</span>
                <span className="font-semibold">$756.64</span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">${MOCK_REFERRAL_DATA.totalEarnings}</span>
              </div>
            </div>
          </Card>

          {/* How It Works */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">How It Works</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">Share Your Link</p>
                  <p className="text-xs text-muted-foreground">
                    Copy and share your unique referral link
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">They Sign Up</p>
                  <p className="text-xs text-muted-foreground">
                    Your referral signs up using your link
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">They Subscribe</p>
                  <p className="text-xs text-muted-foreground">
                    They purchase a paid plan
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-sm font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium text-sm">You Earn</p>
                  <p className="text-xs text-muted-foreground">
                    Earn 20% commission every month they stay subscribed
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "referrals" && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Your Referrals</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Plan</th>
                  <th className="text-right py-3 px-4 font-semibold">Monthly Value</th>
                  <th className="text-right py-3 px-4 font-semibold">Commission</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_REFERRALS.map((referral) => (
                  <tr key={referral.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{referral.referredEmail}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          referral.status === "active"
                            ? "bg-green-500/20 text-green-700"
                            : referral.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-700"
                              : "bg-red-500/20 text-red-700"
                        }`}
                      >
                        {referral.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{referral.subscription}</td>
                    <td className="py-3 px-4 text-right">${referral.monthlyValue}</td>
                    <td className="py-3 px-4 text-right font-semibold">
                      ${referral.commission.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-medium ${
                          referral.commissionStatus === "paid"
                            ? "text-green-600"
                            : referral.commissionStatus === "earned"
                              ? "text-blue-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {referral.commissionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "leaderboard" && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Top Referrers</h3>
          <div className="space-y-3">
            {MOCK_LEADERBOARD.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  entry.name === "You"
                    ? "border-violet-500/50 bg-violet-500/5"
                    : "border-border/50 bg-card/50"
                }`}
              >
                <div className="text-2xl font-bold w-8 text-center">#{entry.rank}</div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  {entry.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{entry.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.referrals} referrals
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${entry.earnings}</p>
                  <p className="text-xs text-muted-foreground">earned</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
