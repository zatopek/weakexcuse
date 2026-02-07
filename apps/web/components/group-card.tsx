"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    emoji: string;
    member_count: number;
  };
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center gap-4 p-5">
          <span className="text-3xl">{group.emoji}</span>
          <div className="flex-1">
            <h3 className="font-semibold">{group.name}</h3>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {group.member_count} member{group.member_count !== 1 ? "s" : ""}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
