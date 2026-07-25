import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Case } from "@/models/Case";
import { toObjectId } from "@/lib/api";
import { CaseDetail, type CaseData } from "./case-detail";

export const dynamic = "force-dynamic";

export default async function CasoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const objectId = toObjectId(id);
  if (!objectId) notFound();

  await dbConnect();
  const doc = await Case.findOne({ _id: objectId, tenantId: session.tenantId }).lean();
  if (!doc) notFound();

  const data = JSON.parse(JSON.stringify(doc)) as CaseData;
  return <CaseDetail data={data} role={session.role} />;
}
