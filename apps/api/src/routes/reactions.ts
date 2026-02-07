import { FastifyInstance } from "fastify";
import { sql } from "@weakexcuse/db";

export async function reactionRoutes(app: FastifyInstance) {
  // POST /reactions — toggle emoji reaction (add/remove)
  app.post("/reactions", async (request) => {
    const { incident_id, emoji } = request.body as {
      incident_id: string;
      emoji: string;
    };

    // Verify user is in the incident's group
    const [incident] = await sql`
      SELECT group_id FROM incidents WHERE id = ${incident_id}
    `;
    if (!incident) {
      return { error: "Incident not found" };
    }

    const [membership] = await sql`
      SELECT 1 FROM group_members
      WHERE group_id = ${incident.group_id} AND user_id = ${request.user.id} AND left_at IS NULL
    `;
    if (!membership) {
      return { error: "Not a member of this group" };
    }

    // Check if reaction already exists — toggle
    const [existing] = await sql`
      SELECT id FROM reactions
      WHERE incident_id = ${incident_id} AND user_id = ${request.user.id} AND emoji = ${emoji}
    `;

    if (existing) {
      await sql`DELETE FROM reactions WHERE id = ${existing.id}`;
      return { action: "removed" };
    }

    await sql`
      INSERT INTO reactions (incident_id, user_id, emoji)
      VALUES (${incident_id}, ${request.user.id}, ${emoji})
    `;

    return { action: "added" };
  });
}
