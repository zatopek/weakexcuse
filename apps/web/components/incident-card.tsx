"use client";

import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReactionBar } from "@/components/reaction-bar";
import { MemberStatsSheet } from "@/components/member-stats-sheet";
import { Check, X, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  last_minute_cancel: { label: "Last-minute cancel", emoji: "❌" },
  ghosted: { label: "Ghosted", emoji: "👻" },
  late_af: { label: "Late AF", emoji: "🕰️" },
  maybe_merchant: { label: '"Maybe" merchant', emoji: "🤡" },
  weak_excuse: { label: "Weak excuse", emoji: "🧢" },
};

const SEVERITY_COLORS: Record<string, string> = {
  mild: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  bad: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  criminal: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const STATUS_BADGES: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Awaiting judgment", variant: "outline" },
  accepted: { label: "Owned up", variant: "default" },
  confirmed: { label: "Guilty as charged", variant: "default" },
  disputed: { label: "Cap detected", variant: "destructive" },
  rejected: { label: "Walked free", variant: "secondary" },
  expired: { label: "Got away with it", variant: "secondary" },
};

interface IncidentCardProps {
  incident: {
    id: string;
    group_id: string;
    accused_id: string;
    accuser_id: string;
    accused_name: string;
    accused_avatar: string | null;
    accuser_name: string;
    accuser_avatar: string | null;
    type: string;
    severity: string;
    note: string | null;
    status: string;
    is_self_report: boolean;
    points: number;
    created_at: string;
    reaction_counts: Array<{ emoji: string; count: number }> | null;
    confirm_votes: number;
    reject_votes: number;
  };
  members: Array<{ user_id: string; name: string }>;
  onAction: () => void;
}

export function IncidentCard({ incident, onAction }: IncidentCardProps) {
  const [loading, setLoading] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const typeInfo = TYPE_LABELS[incident.type] || {
    label: incident.type,
    emoji: "?",
  };
  const statusInfo = STATUS_BADGES[incident.status] || {
    label: incident.status,
    variant: "outline" as const,
  };
  const timeAgo = formatTimeAgo(incident.created_at);

  async function handleAction(action: "accept" | "deny") {
    setLoading(true);
    try {
      const result = await api<{ error?: string }>(
        `/incidents/${incident.id}/${action}`,
        { method: "POST" },
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(action === "accept" ? "Fair enough, respect" : "Not having it!");
        onAction();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(confirm: boolean) {
    setLoading(true);
    try {
      await api("/votes", {
        method: "POST",
        body: JSON.stringify({ incident_id: incident.id, confirm }),
      });
      toast.success(confirm ? "The people have spoken" : "Giving them the benefit of the doubt");
      onAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{typeInfo.emoji}</span>
              <div>
                <p className="text-sm font-medium">
                  {incident.is_self_report ? (
                    <>
                      <button
                        className="font-semibold hover:underline"
                        onClick={() => setStatsOpen(true)}
                      >
                        {incident.accused_name}
                      </button>{" "}
                      came clean
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">
                        {incident.accuser_name}
                      </span>{" "}
                      says{" "}
                      <button
                        className="font-semibold hover:underline"
                        onClick={() => setStatsOpen(true)}
                      >
                        {incident.accused_name}
                      </button>
                      {" "}allegedly
                    </>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {typeInfo.label} &middot;{" "}
                  <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${SEVERITY_COLORS[incident.severity] || ""}`}>
                    {incident.severity} ({incident.points}pt
                    {incident.points !== 1 ? "s" : ""})
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
          </div>

          {incident.note && (
            <p className="mb-3 rounded-md bg-muted/50 p-2 text-sm italic">
              &ldquo;{incident.note}&rdquo;
            </p>
          )}

          <div className="flex items-center justify-between">
            <ReactionBar
              incidentId={incident.id}
              reactionCounts={incident.reaction_counts}
              onReact={onAction}
            />

            <div className="flex items-center gap-2">
              {incident.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleAction("accept")}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Fair enough
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleAction("deny")}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Cap!
                  </Button>
                </>
              )}
              {incident.status === "disputed" && (
                <>
                  <span className="text-xs text-muted-foreground">
                    {incident.confirm_votes} say guilty
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleVote(true)}
                  >
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                    Guilty
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => handleVote(false)}
                  >
                    Innocent
                  </Button>
                </>
              )}
            </div>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            <Clock className="mr-1 inline-block h-3 w-3" />
            {timeAgo}
          </p>
        </CardContent>
      </Card>

      <MemberStatsSheet
        open={statsOpen}
        onOpenChange={setStatsOpen}
        groupId={incident.group_id}
        userId={incident.accused_id}
        userName={incident.accused_name}
      />
    </>
  );
}

function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}
