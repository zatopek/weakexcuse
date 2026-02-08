"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { GroupView } from "@/components/group-view";
import { Skeleton } from "@/components/ui/skeleton";

interface GroupData {
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
}

export default function GroupPage() {
  const params = useParams();
  const groupId = params.id as string;
  const [group, setGroup] = useState<GroupData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadGroup() {
    try {
      const data = await api<GroupData>(`/groups/${groupId}`);
      setGroup(data);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroup();
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, [groupId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!group || !currentUserId) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Group not found or you don&apos;t have access.
      </div>
    );
  }

  return <GroupView group={group} currentUserId={currentUserId} onUpdate={loadGroup} />;
}
