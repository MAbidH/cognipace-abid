import { redirect } from "next/navigation";
import { isStudent } from "../../lib/auth";
import Learn from "../../components/Learn";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  if (!(await isStudent())) redirect("/");
  return <Learn />;
}
