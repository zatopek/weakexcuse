"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IncidentCard } from "@/components/incident-card";
import { CreateIncidentDialog } from "@/components/create-incident-dialog";
import { Leaderboard } from "@/components/leaderboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, DoorOpen, Plus } from "lucide-react";
import { toast } from "sonner";

interface IncidentData {
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
  expires_at: string;
  scored_at: string | null;
  created_at: string;
  reaction_counts: Array<{ emoji: string; count: number }> | null;
  confirm_votes: number;
  reject_votes: number;
}

interface GroupViewProps {
  group: {
    id: string;
    name: string;
    emoji: string;
    invite_code: string;
    member_count: number;
    members: Array<{
      id: string;
      user_id: string;
      name: string;
      email: string;
      avatar_url: string | null;
      role: string;
    }>;
  };
  onUpdate: () => void;
}

export function GroupView({ group, onUpdate }: GroupViewProps) {
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();

  async function loadIncidents() {
    try {
      const data = await api<IncidentData[]>(
        `/incidents?group_id=${group.id}`,
      );
      setIncidents(data);
    } catch {
      // handle silently
    } finally {
      setLoadingIncidents(false);
    }
  }

  useEffect(() => {
    loadIncidents();
  }, [group.id]);

  function copyInviteCode() {
    navigator.clipboard.writeText(group.invite_code);
    toast.success("Invite code copied!");
  }

  async function handleLeave() {
    if (!confirm("Leave this group? Your stats will be frozen.")) return;
    try {
      await api(`/groups/${group.id}/leave`, { method: "POST" });
      toast.success("Left group");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to leave");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{group.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="text-sm text-muted-foreground">
              {group.member_count} member
              {group.member_count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyInviteCode}>
            <Copy className="mr-2 h-3.5 w-3.5" />
            Invite
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            File incident
          </Button>
        </div>
      </div>

      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4 space-y-4">
          {loadingIncidents ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))
          ) : incidents.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="mb-2 text-lg">No incidents yet</p>
              <p className="text-sm">
                Be the first to file an incident (or self-report).
              </p>
            </div>
          ) : (
            incidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                members={group.members}
                onAction={loadIncidents}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Leaderboard groupId={group.id} members={group.members} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <div className="space-y-3">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {(member.name || member.email)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {member.name || member.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
                {member.role === "owner" && (
                  <Badge variant="secondary">Owner</Badge>
                )}
              </div>
            ))}
          </div>
          <Separator className="my-6" />
          <Button variant="destructive" size="sm" onClick={handleLeave}>
            <DoorOpen className="mr-2 h-4 w-4" />
            Leave group
          </Button>
        </TabsContent>
      </Tabs>

      <CreateIncidentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        groupId={group.id}
        members={group.members}
        onCreated={loadIncidents}
      />
    </div>
  );
}
