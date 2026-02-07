"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const TYPE_LABELS: Record<string, string> = {
  last_minute_cancel: "❌ Last-minute cancel",
  ghosted: "👻 Ghosted",
  late_af: "🕰️ Late AF",
  maybe_merchant: '🤡 "Maybe" merchant',
  weak_excuse: "🧢 Weak excuse",
};

interface MemberStats {
  points_30d: number;
  points_90d: number;
  points_career: number;
  most_common_offense: string | null;
  offense_breakdown: Array<{ type: string; count: number }>;
  flake_streak: number;
  clean_streak_days: number | null;
  self_report_rate: number;
  acceptance_rate: number;
}

interface MemberStatsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  userId: string;
  userName: string;
}

export function MemberStatsSheet({
  open,
  onOpenChange,
  groupId,
  userId,
  userName,
}: MemberStatsSheetProps) {
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api<MemberStats>(
      `/stats/member?group_id=${groupId}&user_id=${userId}`,
    )
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [open, groupId, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{userName}&apos;s Rap Sheet</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : !stats ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t pull up the receipts right now.
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="mb-2 font-semibold">Menace Score</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted p-2">
                  <p className="text-lg font-bold">{stats.points_30d}</p>
                  <p className="text-xs text-muted-foreground">30 days</p>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <p className="text-lg font-bold">{stats.points_90d}</p>
                  <p className="text-xs text-muted-foreground">90 days</p>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <p className="text-lg font-bold">{stats.points_career}</p>
                  <p className="text-xs text-muted-foreground">Career</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 font-semibold">Signature Move</h4>
              <p>
                {stats.most_common_offense
                  ? TYPE_LABELS[stats.most_common_offense] ||
                    stats.most_common_offense
                  : "Squeaky clean (for now)"}
              </p>
            </div>

            {stats.offense_breakdown.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 font-semibold">Greatest Hits</h4>
                  <div className="space-y-1">
                    {stats.offense_breakdown.map((o) => (
                      <div
                        key={o.type}
                        className="flex items-center justify-between"
                      >
                        <span>
                          {TYPE_LABELS[o.type] || o.type}
                        </span>
                        <span className="font-medium">{o.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Flake Streak</p>
                <p className="font-semibold">
                  {stats.flake_streak > 0
                    ? `🔥 ${stats.flake_streak} in a row`
                    : "Spotless (sus)"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clean Streak</p>
                <p className="font-semibold">
                  {stats.clean_streak_days !== null
                    ? `${stats.clean_streak_days}d`
                    : "No data"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Self-Report Rate
                </p>
                <p className="font-semibold">{stats.self_report_rate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Acceptance Rate
                </p>
                <p className="font-semibold">{stats.acceptance_rate}%</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
