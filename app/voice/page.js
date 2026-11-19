import { redirect } from "next/navigation";
import { isStudent } from "../../lib/auth";
import { computeRewards } from "../../lib/rewards";
import { minutesToday } from "../../lib/curriculum";
import Shell from "../../components/Shell";
import Voice from "../../components/Voice";
import { dailyCap } from "../../lib/calendar";

export const dynamic = "force-dynamic";

/** HER VOICE (29 Oct 2026, review: "ask Faiza what she wants"). Five boxes in her words; Abid reads them on /guardian. */
export default async function VoicePage() {
  if (!(await isStudent())) redirect("/");
  const [rw, mins] = await Promise.all([computeRewards().catch(() => null), minutesToday().catch(() => null)]);
  return (
    <Shell active="/voice" rw={rw} mins={mins} cap={dailyCap()}>
      <main className="wrap narrow"><Voice /></main>
    </Shell>
  );
}
