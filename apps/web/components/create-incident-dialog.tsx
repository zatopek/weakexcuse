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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const INCIDENT_TYPES = [
  { value: "last_minute_cancel", label: "❌ Last-minute cancel" },
  { value: "ghosted", label: "👻 Ghosted" },
  { value: "late_af", label: "🕰️ Late AF" },
  { value: "maybe_merchant", label: '🤡 "Maybe" merchant' },
  { value: "weak_excuse", label: "🧢 Weak excuse" },
];

const SEVERITY_OPTIONS = [
  { value: "mild", label: "Mild (1pt)", description: "Eye-roll worthy" },
  { value: "bad", label: "Bad (2pts)", description: "Genuinely not cool" },
  { value: "criminal", label: "Criminal (3pts)", description: "Legendary fumble" },
];

interface CreateIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  members: Array<{
    user_id: string;
    name: string;
    email: string;
  }>;
  onCreated: () => void;
}

export function CreateIncidentDialog({
  open,
  onOpenChange,
  groupId,
  members,
  onCreated,
}: CreateIncidentDialogProps) {
  const [accusedId, setAccusedId] = useState("");
  const [type, setType] = useState("last_minute_cancel");
  const [severity, setSeverity] = useState("mild");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accusedId) {
      toast.error("Who are we calling out here?");
      return;
    }

    setLoading(true);
    try {
      const result = await api<{ error?: string }>("/incidents", {
        method: "POST",
        body: JSON.stringify({
          group_id: groupId,
          accused_id: accusedId,
          type,
          severity,
          note: note.trim() || undefined,
        }),
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("The record has been updated, your honor");
        setAccusedId("");
        setType("last_minute_cancel");
        setSeverity("mild");
        setNote("");
        onOpenChange(false);
        onCreated();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to file incident",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Who fumbled?</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Who did it?</Label>
            <Select value={accusedId} onValueChange={setAccusedId}>
              <SelectTrigger>
                <SelectValue placeholder="Pick the suspect..." />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.name || m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>What did they do?</Label>
            <RadioGroup value={type} onValueChange={setType}>
              {INCIDENT_TYPES.map((t) => (
                <div key={t.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={t.value} id={`type-${t.value}`} />
                  <Label htmlFor={`type-${t.value}`} className="font-normal">
                    {t.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label>How bad was it?</Label>
            <RadioGroup value={severity} onValueChange={setSeverity}>
              {SEVERITY_OPTIONS.map((s) => (
                <div key={s.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={s.value}
                    id={`severity-${s.value}`}
                  />
                  <Label
                    htmlFor={`severity-${s.value}`}
                    className="font-normal"
                  >
                    {s.label}{" "}
                    <span className="text-xs text-muted-foreground">
                      — {s.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">
              Note{" "}
              <span className="text-xs text-muted-foreground">(optional, 280 chars)</span>
            </Label>
            <Textarea
              id="note"
              placeholder="Sources say..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={280}
              rows={2}
            />
            <p className="text-right text-xs text-muted-foreground">
              {note.length}/280
            </p>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Logging it..." : "Put it on the record"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
