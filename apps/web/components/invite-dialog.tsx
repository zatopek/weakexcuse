"use client";

import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Copy, Mail } from "lucide-react";
import { toast } from "sonner";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  inviteCode: string;
}

export function InviteDialog({
  open,
  onOpenChange,
  groupId,
  inviteCode,
}: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await api(`/groups/${groupId}/invite`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      toast.success("Invite sent! They can't hide now");
      setEmail("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send invite",
      );
    } finally {
      setLoading(false);
    }
  }

  function copyInviteCode() {
    navigator.clipboard.writeText(inviteCode);
    toast.success("Invite code copied! Spread the accountability");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite someone</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSend} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Send invite via email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            <Mail className="mr-2 h-3.5 w-3.5" />
            {loading ? "Sending..." : "Send invite"}
          </Button>
        </form>

        <div className="relative my-2">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <div className="grid gap-2">
          <Label>Share invite code</Label>
          <div className="flex gap-2">
            <Input value={inviteCode} readOnly className="font-mono" />
            <Button type="button" variant="outline" size="icon" onClick={copyInviteCode}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
