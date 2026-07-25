import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Contract } from "@/models/Contract";
import { toObjectId } from "@/lib/api";
import { ContractDetail, type ContractData } from "./contract-detail";

export const dynamic = "force-dynamic";

export default async function ContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const objectId = toObjectId(id);
  if (!objectId) notFound();

  await dbConnect();
  const doc = await Contract.findOne({ _id: objectId, tenantId: session.tenantId }).lean();
  if (!doc) notFound();

  const data = JSON.parse(JSON.stringify(doc)) as ContractData;
  return <ContractDetail data={data} role={session.role} />;
}
