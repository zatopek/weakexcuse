import { FastifyRequest, FastifyReply } from "fastify";
import { supabaseAdmin } from "../lib/supabase.js";
import { sql } from "@weakexcuse/db";

declare module "fastify" {
  interface FastifyRequest {
    user: { id: string; email: string };
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Missing authorization token" });
  }

  const token = authHeader.slice(7);

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return reply.code(401).send({ error: "Invalid or expired token" });
  }

  // Upsert user row in our DB
  await sql`
    INSERT INTO users (id, email, name, avatar_url)
    VALUES (
      ${user.id},
      ${user.email!},
      ${user.user_metadata?.name ?? null},
      ${user.user_metadata?.avatar_url ?? null}
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = now()
  `;

  request.user = { id: user.id, email: user.email! };
}
