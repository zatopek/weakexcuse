"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GroupCard } from "@/components/group-card";
import { CreateGroupDialog } from "@/components/create-group-dialog";
import { JoinGroupDialog } from "@/components/join-group-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, UserPlus } from "lucide-react";

interface GroupData {
  id: string;
  name: string;
  emoji: string;
  invite_code: string;
  member_count: number;
}

export default function DashboardPage() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  async function loadGroups() {
    try {
      const data = await api<GroupData[]>("/groups");
      setGroups(data);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Groups</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setJoinOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Join
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="mb-2 text-lg font-medium">No groups yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Create a group or join one with an invite code.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setJoinOpen(true)}
            >
              Join a group
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              Create a group
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={loadGroups}
      />
      <JoinGroupDialog
        open={joinOpen}
        onOpenChange={setJoinOpen}
        onJoined={loadGroups}
      />
    </div>
  );
}
