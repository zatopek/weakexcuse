import { FastifyInstance } from "fastify";
import { sql } from "@weakexcuse/db";

export async function statsRoutes(app: FastifyInstance) {
  // GET /stats/leaderboard?group_id&window — ranked members by points
  app.get("/stats/leaderboard", async (request, reply) => {
    const { group_id, window = "30" } = request.query as {
      group_id: string;
      window?: string;
    };

    if (!group_id) {
      return reply.code(400).send({ error: "group_id is required" });
    }

    const days = parseInt(window);
    // If window is 0 or very large, treat as career (no time filter)
    const timeFilter =
      days > 0 && days <= 365
        ? sql`AND i.scored_at > now() - interval '${sql.unsafe(String(days))} days'`
        : sql``;

    const leaderboard = await sql`
      SELECT
        u.id,
        u.name,
        u.avatar_url,
        COALESCE(SUM(i.points), 0)::int AS total_points,
        COUNT(i.id)::int AS incident_count
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      LEFT JOIN incidents i ON i.accused_id = u.id
        AND i.group_id = ${group_id}
        AND i.status IN ('accepted', 'confirmed')
        AND i.scored_at IS NOT NULL
        ${timeFilter}
      WHERE gm.group_id = ${group_id} AND gm.left_at IS NULL
      GROUP BY u.id, u.name, u.avatar_url
      ORDER BY total_points DESC, incident_count DESC
    `;

    return leaderboard;
  });

  // GET /stats/member?group_id&user_id — detailed member stats
  app.get("/stats/member", async (request, reply) => {
    const { group_id, user_id } = request.query as {
      group_id: string;
      user_id: string;
    };

    if (!group_id || !user_id) {
      return reply.code(400).send({ error: "group_id and user_id are required" });
    }

    // Points by time window
    const [points30] = await sql`
      SELECT COALESCE(SUM(points), 0)::int AS points
      FROM incidents
      WHERE accused_id = ${user_id} AND group_id = ${group_id}
        AND status IN ('accepted', 'confirmed') AND scored_at > now() - interval '30 days'
    `;
    const [points90] = await sql`
      SELECT COALESCE(SUM(points), 0)::int AS points
      FROM incidents
      WHERE accused_id = ${user_id} AND group_id = ${group_id}
        AND status IN ('accepted', 'confirmed') AND scored_at > now() - interval '90 days'
    `;
    const [pointsCareer] = await sql`
      SELECT COALESCE(SUM(points), 0)::int AS points
      FROM incidents
      WHERE accused_id = ${user_id} AND group_id = ${group_id}
        AND status IN ('accepted', 'confirmed')
    `;

    // Most common offense
    const [topOffense] = await sql`
      SELECT type, count(*)::int AS count
      FROM incidents
      WHERE accused_id = ${user_id} AND group_id = ${group_id}
        AND status IN ('accepted', 'confirmed')
      GROUP BY type
      ORDER BY count DESC
      LIMIT 1
    `;

    // Offense breakdown
    const offenseBreakdown = await sql`
      SELECT type, count(*)::int AS count
      FROM incidents
      WHERE accused_id = ${user_id} AND group_id = ${group_id}
        AND status IN ('accepted', 'confirmed')
      GROUP BY type
      ORDER BY count DESC
    `;

    // Total incidents for rates
    const [totals] = await sql`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE is_self_report)::int AS self_reports,
        count(*) FILTER (WHERE status = 'accepted')::int AS accepted,
        count(*) FILTER (WHERE status IN ('accepted', 'confirmed'))::int AS scored
      FROM incidents
      WHERE accused_id = ${user_id} AND group_id = ${group_id}
    `;

    // Flake streak: consecutive scored incidents (most recent)
    const recentIncidents = await sql`
      SELECT status, scored_at, created_at
      FROM incidents
      WHERE accused_id = ${user_id} AND group_id = ${group_id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    let flakeStreak = 0;
    for (const inc of recentIncidents) {
      if (inc.status === "accepted" || inc.status === "confirmed") {
        flakeStreak++;
      } else {
        break;
      }
    }

    // Clean streak: days since last scored incident
    const [lastScored] = await sql`
      SELECT scored_at
      FROM incidents
      WHERE accused_id = ${user_id} AND group_id = ${group_id}
        AND status IN ('accepted', 'confirmed')
      ORDER BY scored_at DESC
      LIMIT 1
    `;

    const cleanStreakDays = lastScored?.scored_at
      ? Math.floor(
          (Date.now() - new Date(lastScored.scored_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      points_30d: points30.points,
      points_90d: points90.points,
      points_career: pointsCareer.points,
      most_common_offense: topOffense?.type ?? null,
      offense_breakdown: offenseBreakdown,
      flake_streak: flakeStreak,
      clean_streak_days: cleanStreakDays,
      self_report_rate:
        totals.total > 0
          ? Math.round((totals.self_reports / totals.total) * 100)
          : 0,
      acceptance_rate:
        totals.total > 0
          ? Math.round((totals.accepted / totals.total) * 100)
          : 0,
    };
  });
}
