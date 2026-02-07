"use client";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const REACTIONS = [
  { key: "laugh", emoji: "😂" },
  { key: "cry", emoji: "😭" },
  { key: "skull", emoji: "💀" },
  { key: "handshake", emoji: "🤝" },
] as const;

interface ReactionBarProps {
  incidentId: string;
  reactionCounts: Array<{ emoji: string; count: number }> | null;
  onReact: () => void;
}

export function ReactionBar({
  incidentId,
  reactionCounts,
  onReact,
}: ReactionBarProps) {
  const countsMap = new Map<string, number>();
  if (reactionCounts) {
    for (const r of reactionCounts) {
      countsMap.set(r.emoji, r.count);
    }
  }

  async function handleReact(emoji: string) {
    try {
      await api("/reactions", {
        method: "POST",
        body: JSON.stringify({ incident_id: incidentId, emoji }),
      });
      onReact();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to react");
    }
  }

  return (
    <div className="flex gap-1">
      {REACTIONS.map((r) => {
        const count = countsMap.get(r.key) || 0;
        return (
          <Button
            key={r.key}
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => handleReact(r.key)}
          >
            {r.emoji}
            {count > 0 && <span>{count}</span>}
          </Button>
        );
      })}
    </div>
  );
}
