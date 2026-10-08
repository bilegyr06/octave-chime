// Render Cron Job entrypoint (or manual run): POST /cron/daily-summary.
// Usage: node scripts/daily-summary.js  (reads CRON_SECRET + API_URL from env)
(async () => {
  const base = process.env.API_URL ?? "http://localhost:4000";
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret) {
    console.error("CRON_SECRET is not set");
    process.exit(1);
  }
  const res = await fetch(`${base}/cron/daily-summary`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json().catch(() => ({}));
  console.log(res.status, JSON.stringify(body, null, 2));
  if (!res.ok) process.exit(1);
})();