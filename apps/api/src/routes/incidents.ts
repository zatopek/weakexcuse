import { FastifyInstance } from "fastify";
import { sql } from "@weakexcuse/db";
import { checkAndResolveMajority } from "../lib/majority.js";

const SELF_REPORT_EXPIRY_HOURS = 48;
const ACCUSATION_EXPIRY_DAYS = 7;
const DAILY_ACCUSATION_LIMIT = 3;

export async function incidentRoutes(app: FastifyInstance) {
  // GET /incidents?group_id&limit&offset — paginated feed
  app.get("/incidents", async (request, reply) => {
    const { group_id, limit = "20", offset = "0" } = request.query as {
      group_id: string;
      limit?: string;
      offset?: string;
    };

    if (!group_id) {
      return reply.code(400).send({ error: "group_id is required" });
    }

    // Verify membership
    const [membership] = await sql`
      SELECT 1 FROM group_members
      WHERE group_id = ${group_id} AND user_id = ${request.user.id} AND left_at IS NULL
    `;
    if (!membership) {
      return reply.code(403).send({ error: "Not a member of this group" });
    }

    const incidents = await sql`
      SELECT i.*,
        accuser.name AS accuser_name, accuser.avatar_url AS accuser_avatar,
        accused.name AS accused_name, accused.avatar_url AS accused_avatar,
        (SELECT json_agg(json_build_object('emoji', r.emoji, 'count', r.cnt))
         FROM (
           SELECT emoji, count(*) AS cnt
           FROM reactions WHERE incident_id = i.id
           GROUP BY emoji
         ) r
        ) AS reaction_counts,
        (SELECT count(*) FROM votes WHERE incident_id = i.id AND confirm = true) AS confirm_votes,
        (SELECT count(*) FROM votes WHERE incident_id = i.id AND confirm = false) AS reject_votes,
        (SELECT count(*) FROM group_members WHERE group_id = i.group_id AND user_id != i.accused_id AND left_at IS NULL) AS eligible_voters
      FROM incidents i
      JOIN users accuser ON accuser.id = i.accuser_id
      JOIN users accused ON accused.id = i.accused_id
      WHERE i.group_id = ${group_id}
      ORDER BY i.created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;

    return incidents;
  });

  // POST /incidents — create new incident
  app.post("/incidents", async (request, reply) => {
    const { group_id, accused_id, type, severity, note } = request.body as {
      group_id: string;
      accused_id: string;
      type: string;
      severity?: string;
      note?: string;
    };

    // Verify both users are group members
    const members = await sql`
      SELECT user_id FROM group_members
      WHERE group_id = ${group_id} AND user_id IN (${request.user.id}, ${accused_id}) AND left_at IS NULL
    `;
    if (members.length < 2 && request.user.id !== accused_id) {
      return reply.code(400).send({ error: "Both users must be active group members" });
    }
    if (members.length < 1) {
      return reply.code(403).send({ error: "You are not a member of this group" });
    }

    const isSelfReport = request.user.id === accused_id;

    // Rate limit: max 3 accusations per day (self-reports don't count)
    if (!isSelfReport) {
      const [{ count }] = await sql`
        SELECT count(*) FROM incidents
        WHERE accuser_id = ${request.user.id}
          AND group_id = ${group_id}
          AND accuser_id != accused_id
          AND created_at > now() - interval '24 hours'
      `;
      if (parseInt(count) >= DAILY_ACCUSATION_LIMIT) {
        return reply.code(429).send({ error: "Daily accusation limit reached (3 per day)" });
      }
    }

    const expiresAt = isSelfReport
      ? sql`now() + interval '${sql.unsafe(String(SELF_REPORT_EXPIRY_HOURS))} hours'`
      : sql`now() + interval '${sql.unsafe(String(ACCUSATION_EXPIRY_DAYS))} days'`;

    const [incident] = await sql`
      INSERT INTO incidents (group_id, accused_id, accuser_id, type, severity, note, expires_at)
      VALUES (
        ${group_id},
        ${accused_id},
        ${request.user.id},
        ${type},
        ${severity || "mild"},
        ${note || null},
        ${expiresAt}
      )
      RETURNING *
    `;

    // If self-report, auto-accept
    if (isSelfReport) {
      const [updated] = await sql`
        UPDATE incidents
        SET status = 'accepted', scored_at = now(), updated_at = now()
        WHERE id = ${incident.id}
        RETURNING *
      `;
      return updated;
    }

    return incident;
  });

  // POST /incidents/:id/accept — target accepts the incident
  app.post("/incidents/:id/accept", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [incident] = await sql`
      SELECT * FROM incidents WHERE id = ${id}
    `;
    if (!incident) {
      return reply.code(404).send({ error: "Incident not found" });
    }
    if (incident.accused_id !== request.user.id) {
      return reply.code(403).send({ error: "Only the accused can accept" });
    }
    if (incident.status !== "pending") {
      return reply.code(400).send({ error: "Incident is not pending" });
    }

    const [updated] = await sql`
      UPDATE incidents
      SET status = 'accepted', scored_at = now(), updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;

    return updated;
  });

  // POST /incidents/:id/deny — target denies, moves to disputed
  app.post("/incidents/:id/deny", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [incident] = await sql`
      SELECT * FROM incidents WHERE id = ${id}
    `;
    if (!incident) {
      return reply.code(404).send({ error: "Incident not found" });
    }
    if (incident.accused_id !== request.user.id) {
      return reply.code(403).send({ error: "Only the accused can deny" });
    }
    if (incident.status !== "pending") {
      return reply.code(400).send({ error: "Incident is not pending" });
    }

    const [updated] = await sql`
      UPDATE incidents
      SET status = 'disputed', updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;

    // Auto-cast accuser's confirm vote
    await sql`
      INSERT INTO votes (incident_id, user_id, confirm)
      VALUES (${id}, ${incident.accuser_id}, true)
      ON CONFLICT DO NOTHING
    `;

    // Check if accuser's vote alone reaches majority (e.g. 2-person group)
    await checkAndResolveMajority(id, incident.group_id, incident.accused_id);

    // Re-fetch to return current status
    const [final] = await sql`SELECT * FROM incidents WHERE id = ${id}`;
    return final;
  });
}
