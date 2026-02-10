import { FastifyInstance } from "fastify";
import { sql } from "@weakexcuse/db";
import { checkAndResolveMajority } from "../lib/majority.js";

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

    // Accused can't vote
    if (incident.accused_id === request.user.id) {
      return reply.code(403).send({ error: "Cannot vote on incidents you are accused in" });
    }

    // Accuser's vote is auto-cast and immutable
    if (incident.accuser_id === request.user.id) {
      return reply
        .code(403)
        .send({ error: "Your vote was automatically cast when you filed the callout" });
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

    // Check majority
    const resolution = await checkAndResolveMajority(
      incident_id,
      incident.group_id,
      incident.accused_id,
    );

    const [{ confirm_count, reject_count }] = await sql`
      SELECT
        count(*) FILTER (WHERE confirm = true) AS confirm_count,
        count(*) FILTER (WHERE confirm = false) AS reject_count
      FROM votes
      WHERE incident_id = ${incident_id}
    `;

    return {
      ok: true,
      confirm_count: parseInt(confirm_count),
      reject_count: parseInt(reject_count),
      resolution,
    };
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
