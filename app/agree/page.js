import { redirect } from "next/navigation";
import { isStudent } from "../../lib/auth";
import { computeRewards } from "../../lib/rewards";
import { minutesToday } from "../../lib/curriculum";
import Shell from "../../components/Shell";
import Agreement from "../../components/Agreement";
import { dailyCap } from "../../lib/calendar";
import { AGREEMENT_TITLE, HER_RULES, ABID_PROMISES, MIN_WORDS } from "../../lib/agreement";

export const dynamic = "force-dynamic";

/** Her winter school agreement (3 Nov 2026): she reads the rules and signs them in her own words. */
export default async function AgreePage() {
  if (!(await isStudent())) redirect("/");
  const [rw, mins] = await Promise.all([computeRewards().catch(() => null), minutesToday().catch(() => null)]);
  return (
    <Shell active="/agree" rw={rw} mins={mins} cap={dailyCap()}>
      <main className="wrap narrow"><Agreement title={AGREEMENT_TITLE} rules={HER_RULES} promises={ABID_PROMISES} minWords={MIN_WORDS} /></main>
    </Shell>
  );
}
