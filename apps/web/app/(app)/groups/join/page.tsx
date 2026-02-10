"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function JoinGroupPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError("Missing invite code. Check your invite link and try again.");
      return;
    }

    let cancelled = false;

    async function join() {
      try {
        const group = await api<{ id: string; name: string }>("/groups/join", {
          method: "POST",
          body: JSON.stringify({ invite_code: code }),
        });

        if (cancelled) return;

        toast.success("You're in! No backing out now");
        router.replace(`/groups/${group.id}`);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to join group",
        );
      }
    }

    join();

    return () => {
      cancelled = true;
    };
  }, [code, router]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Couldn&apos;t join group</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm underline"
            >
              Go home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Joining group...</p>
      </div>
    </div>
  );
}
