import { sql } from "@weakexcuse/db";

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function startExpireIncidentsJob() {
  async function run() {
    try {
      const result = await sql`
        UPDATE incidents
        SET status = 'expired', updated_at = now()
        WHERE status IN ('pending', 'disputed')
          AND expires_at < now()
      `;
      if (result.count > 0) {
        console.log(`Expired ${result.count} incidents`);
      }
    } catch (err) {
      console.error("Error expiring incidents:", err);
    }
  }

  // Run immediately on start, then every 5 minutes
  run();
  setInterval(run, INTERVAL_MS);
}
