"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberStatsSheet } from "@/components/member-stats-sheet";

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_url: string | null;
  total_points: number;
  incident_count: number;
}

interface LeaderboardProps {
  groupId: string;
  members: Array<{ user_id: string; name: string }>;
}

export function Leaderboard({ groupId }: LeaderboardProps) {
  const [window, setWindow] = useState("30");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  async function load(w: string) {
    setLoading(true);
    try {
      const result = await api<LeaderboardEntry[]>(
        `/stats/leaderboard?group_id=${groupId}&window=${w}`,
      );
      setData(result);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(window);
  }, [groupId, window]);

  return (
    <div>
      <Tabs
        value={window}
        onValueChange={(v) => setWindow(v)}
      >
        <TabsList>
          <TabsTrigger value="30">30 days</TabsTrigger>
          <TabsTrigger value="90">90 days</TabsTrigger>
          <TabsTrigger value="0">Career</TabsTrigger>
        </TabsList>

        <TabsContent value={window} className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Everyone&apos;s been an angel... allegedly.
            </p>
          ) : (
            <div className="space-y-2">
              {data.map((entry, index) => (
                <button
                  key={entry.id}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                  onClick={() =>
                    setSelectedUser({ id: entry.id, name: entry.name })
                  }
                >
                  <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                    {index === 0
                      ? "🏆"
                      : index === 1
                        ? "🥈"
                        : index === 2
                          ? "🥉"
                          : `${index + 1}`}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={entry.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {(entry.name || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {entry.name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.incident_count} incident
                      {entry.incident_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{entry.total_points}</p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedUser && (
        <MemberStatsSheet
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          groupId={groupId}
          userId={selectedUser.id}
          userName={selectedUser.name}
        />
      )}
    </div>
  );
}
