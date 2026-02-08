import { FastifyInstance } from "fastify";
import { sql } from "@weakexcuse/db";
import { sendInviteEmail } from "../lib/sendgrid.js";

export async function groupRoutes(app: FastifyInstance) {
  // GET /groups — list user's groups
  app.get("/groups", async (request) => {
    const groups = await sql`
      SELECT g.*, gm.role,
        (SELECT count(*) FROM group_members WHERE group_id = g.id AND left_at IS NULL) AS member_count
      FROM groups g
      JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ${request.user.id}
      WHERE gm.left_at IS NULL
      ORDER BY g.created_at DESC
    `;
    return groups;
  });

  // POST /groups — create group
  app.post("/groups", async (request, reply) => {
    const { name, emoji } = request.body as { name: string; emoji?: string };
    if (!name || name.trim().length === 0) {
      return reply.code(400).send({ error: "Group name is required" });
    }

    const [group] = await sql`
      INSERT INTO groups (name, emoji, created_by)
      VALUES (${name.trim()}, ${emoji || "🔥"}, ${request.user.id})
      RETURNING *
    `;

    // Add creator as owner
    await sql`
      INSERT INTO group_members (group_id, user_id, role)
      VALUES (${group.id}, ${request.user.id}, 'owner')
    `;

    return group;
  });

  // GET /groups/:id — get group details
  app.get("/groups/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    // Verify membership
    const [membership] = await sql`
      SELECT 1 FROM group_members
      WHERE group_id = ${id} AND user_id = ${request.user.id} AND left_at IS NULL
    `;
    if (!membership) {
      return reply.code(403).send({ error: "Not a member of this group" });
    }

    const [group] = await sql`
      SELECT g.*,
        (SELECT count(*) FROM group_members WHERE group_id = g.id AND left_at IS NULL) AS member_count
      FROM groups g
      WHERE g.id = ${id}
    `;

    const members = await sql`
      SELECT gm.*, u.name, u.email, u.avatar_url
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ${id} AND gm.left_at IS NULL
      ORDER BY gm.joined_at
    `;

    return { ...group, members };
  });

  // POST /groups/join — join via invite code
  app.post("/groups/join", async (request, reply) => {
    const { invite_code } = request.body as { invite_code: string };

    const [group] = await sql`
      SELECT * FROM groups WHERE invite_code = ${invite_code}
    `;
    if (!group) {
      return reply.code(404).send({ error: "Invalid invite code" });
    }

    // Check if already a member
    const [existing] = await sql`
      SELECT * FROM group_members
      WHERE group_id = ${group.id} AND user_id = ${request.user.id}
    `;

    if (existing && !existing.left_at) {
      return reply.code(409).send({ error: "Already a member of this group" });
    }

    if (existing && existing.left_at) {
      // Rejoin: clear left_at
      await sql`
        UPDATE group_members
        SET left_at = NULL, joined_at = now()
        WHERE id = ${existing.id}
      `;
    } else {
      await sql`
        INSERT INTO group_members (group_id, user_id, role)
        VALUES (${group.id}, ${request.user.id}, 'member')
      `;
    }

    return group;
  });

  // POST /groups/:id/invite — send email invite
  app.post("/groups/:id/invite", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { email } = request.body as { email: string };

    if (!email || !email.includes("@")) {
      return reply.code(400).send({ error: "A valid email is required" });
    }

    // Verify membership
    const [membership] = await sql`
      SELECT 1 FROM group_members
      WHERE group_id = ${id} AND user_id = ${request.user.id} AND left_at IS NULL
    `;
    if (!membership) {
      return reply.code(403).send({ error: "Not a member of this group" });
    }

    // Get group details
    const [group] = await sql`
      SELECT name, emoji, invite_code FROM groups WHERE id = ${id}
    `;
    if (!group) {
      return reply.code(404).send({ error: "Group not found" });
    }

    // Get inviter name
    const [inviter] = await sql`
      SELECT name, email FROM users WHERE id = ${request.user.id}
    `;

    try {
      await sendInviteEmail({
        to: email,
        inviterName: inviter.name || inviter.email,
        groupName: group.name,
        groupEmoji: group.emoji,
        inviteCode: group.invite_code,
      });
    } catch {
      return reply.code(500).send({ error: "Failed to send invite email" });
    }

    return { ok: true };
  });

  // POST /groups/:id/leave — leave group (freezes stats)
  app.post("/groups/:id/leave", async (request) => {
    const { id } = request.params as { id: string };

    await sql`
      UPDATE group_members
      SET left_at = now()
      WHERE group_id = ${id} AND user_id = ${request.user.id} AND left_at IS NULL
    `;

    return { ok: true };
  });
}
