import { FastifyInstance } from "fastify";
import { sql } from "@weakexcuse/db";

const CONFIRM_QUORUM = 2;

export async function voteRoutes(app: FastifyInstance) {
  // POST /votes — cast a vote on a disputed incident
  app.post("/votes", async (request, reply) => {
    const { incident_id, confirm } = request.body as {
      incident_id: string;
      confirm: boolean;
    };

    const [incident] = await sql`
      SELECT * FROM incidents WHERE id = ${incident_id}
    `;
    if (!incident) {
      return reply.code(404).send({ error: "Incident not found" });
    }
    if (incident.status !== "disputed") {
      return reply.code(400).send({ error: "Incident is not in disputed status" });
    }

    // Can't vote on your own incident
    if (
      incident.accused_id === request.user.id ||
      incident.accuser_id === request.user.id
    ) {
      return reply.code(403).send({ error: "Cannot vote on incidents you are involved in" });
    }

    // Must be a group member
    const [membership] = await sql`
      SELECT 1 FROM group_members
      WHERE group_id = ${incident.group_id} AND user_id = ${request.user.id} AND left_at IS NULL
    `;
    if (!membership) {
      return reply.code(403).send({ error: "Not a member of this group" });
    }

    // Upsert vote
    await sql`
      INSERT INTO votes (incident_id, user_id, confirm)
      VALUES (${incident_id}, ${request.user.id}, ${confirm})
      ON CONFLICT (incident_id, user_id) DO UPDATE SET confirm = ${confirm}
    `;

    // Check quorum
    const [{ count }] = await sql`
      SELECT count(*) FROM votes
      WHERE incident_id = ${incident_id} AND confirm = true
    `;

    if (parseInt(count) >= CONFIRM_QUORUM) {
      await sql`
        UPDATE incidents
        SET status = 'confirmed', scored_at = now(), updated_at = now()
        WHERE id = ${incident_id}
      `;
    }

    return { ok: true, confirm_count: parseInt(count) };
  });

  // GET /votes/:incident_id — get votes for an incident
  app.get("/votes/:incident_id", async (request) => {
    const { incident_id } = request.params as { incident_id: string };

    const votes = await sql`
      SELECT v.*, u.name, u.avatar_url
      FROM votes v
      JOIN users u ON u.id = v.user_id
      WHERE v.incident_id = ${incident_id}
      ORDER BY v.created_at
    `;

    return votes;
  });
}
