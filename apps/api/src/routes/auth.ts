import { FastifyInstance } from "fastify";
import { sql } from "@weakexcuse/db";

export async function authRoutes(app: FastifyInstance) {
  // GET /auth/me — fetch current user profile
  app.get("/auth/me", async (request) => {
    const [user] = await sql`
      SELECT id, email, name, avatar_url, created_at
      FROM users
      WHERE id = ${request.user.id}
    `;
    return user;
  });

  // PATCH /auth/me — update profile
  app.patch("/auth/me", async (request) => {
    const { name, avatar_url } = request.body as {
      name?: string;
      avatar_url?: string;
    };
    const [user] = await sql`
      UPDATE users
      SET
        name = COALESCE(${name ?? null}, name),
        avatar_url = COALESCE(${avatar_url ?? null}, avatar_url),
        updated_at = now()
      WHERE id = ${request.user.id}
      RETURNING id, email, name, avatar_url, created_at
    `;
    return user;
  });
}
