import { redirect } from "next/navigation";
import { isStudent } from "../../lib/auth";
import { computeRewards } from "../../lib/rewards";
import { minutesToday } from "../../lib/curriculum";
import Shell from "../../components/Shell";
import Arena from "../../components/Arena";
import { dailyCap } from "../../lib/calendar";

export const dynamic = "force-dynamic";

export default async function ArenaPage() {
  if (!(await isStudent())) redirect("/");
  const [rw, mins] = await Promise.all([computeRewards().catch(() => null), minutesToday()]);
  return (
    <Shell active="/arena" rw={rw} mins={mins} cap={dailyCap()}>
      <main className="wrap narrow"><Arena /></main>
    </Shell>
  );
}
