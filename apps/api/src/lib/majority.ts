import { sql } from "@weakexcuse/db";

/**
 * Check whether a simple majority of eligible voters has been reached
 * and resolve the incident accordingly.
 *
 * Eligible voters = all active group members except the accused.
 * Majority threshold = floor(eligible / 2) + 1
 *
 * Returns "confirmed" | "rejected" | null
 */
export async function checkAndResolveMajority(
  incidentId: string,
  groupId: string,
  accusedId: string,
): Promise<"confirmed" | "rejected" | null> {
  const [{ count: eligibleStr }] = await sql`
    SELECT count(*) FROM group_members
    WHERE group_id = ${groupId} AND user_id != ${accusedId} AND left_at IS NULL
  `;
  const eligible = parseInt(eligibleStr);
  const majority = Math.floor(eligible / 2) + 1;

  const [{ confirm_count: confirmStr, reject_count: rejectStr }] = await sql`
    SELECT
      count(*) FILTER (WHERE confirm = true) AS confirm_count,
      count(*) FILTER (WHERE confirm = false) AS reject_count
    FROM votes
    WHERE incident_id = ${incidentId}
  `;
  const confirms = parseInt(confirmStr);
  const rejects = parseInt(rejectStr);

  if (confirms >= majority) {
    await sql`
      UPDATE incidents
      SET status = 'confirmed', scored_at = now(), updated_at = now()
      WHERE id = ${incidentId}
    `;
    return "confirmed";
  }

  if (rejects >= majority) {
    await sql`
      UPDATE incidents
      SET status = 'rejected', updated_at = now()
      WHERE id = ${incidentId}
    `;
    return "rejected";
  }

  return null;
}
