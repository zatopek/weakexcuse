import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        user={{
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
        }}
      />
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      <Toaster />
    </div>
  );
}
