"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface JoinGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoined: () => void;
}

export function JoinGroupDialog({
  open,
  onOpenChange,
  onJoined,
}: JoinGroupDialogProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      const group = await api<{ id: string; error?: string }>("/groups/join", {
        method: "POST",
        body: JSON.stringify({ invite_code: code.trim() }),
      });
      if (group.error) {
        toast.error(group.error);
      } else {
        toast.success("You're in! No backing out now");
        setCode("");
        onOpenChange(false);
        onJoined();
        router.push(`/groups/${group.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid invite code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Join a crew</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleJoin} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-code">Invite code</Label>
            <Input
              id="invite-code"
              placeholder="Paste invite code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Joining..." : "Join group"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
