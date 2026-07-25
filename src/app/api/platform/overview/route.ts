import { NextResponse } from "next/server";
import { withPlatformAuth } from "@/lib/platform-admin";
import { Tenant } from "@/models/Tenant";
import { User } from "@/models/User";
import { Case } from "@/models/Case";
import { PlanPayment } from "@/models/PlanPayment";
import { Contract } from "@/models/Contract";
import { Invoice } from "@/models/Invoice";

export const GET = withPlatformAuth(async () => {
  const now = new Date();
  const [
    tenants,
    users,
    cases,
    activePaid,
    suspended,
    paymentsTotal,
    paymentsMonth,
    contracts,
    invoicesPending,
  ] = await Promise.all([
    Tenant.countDocuments(),
    User.countDocuments(),
    Case.countDocuments(),
    Tenant.countDocuments({
      subscriptionPlan: { $in: ["essencial", "profissional", "rede"] },
      $or: [
        { subscriptionPlan: "rede" },
        { planPaidUntil: { $gt: now } },
      ],
    }),
    Tenant.countDocuments({ active: false }),
    PlanPayment.aggregate([
      { $match: { status: "completo" } },
      { $group: { _id: null, total: { $sum: "$amountCents" }, count: { $sum: 1 } } },
    ]),
    PlanPayment.aggregate([
      {
        $match: {
          status: "completo",
          paidAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
      },
      { $group: { _id: null, total: { $sum: "$amountCents" }, count: { $sum: 1 } } },
    ]),
    Contract.countDocuments(),
    Invoice.countDocuments({ status: "pendente" }),
  ]);

  const byPlan = await Tenant.aggregate([
    { $group: { _id: "$subscriptionPlan", count: { $sum: 1 } } },
  ]);

  return NextResponse.json({
    tenants,
    users,
    cases,
    activePaid,
    suspended,
    contracts,
    invoicesPending,
    revenueCents: paymentsTotal[0]?.total ?? 0,
    paymentsCount: paymentsTotal[0]?.count ?? 0,
    monthRevenueCents: paymentsMonth[0]?.total ?? 0,
    monthPaymentsCount: paymentsMonth[0]?.count ?? 0,
    byPlan: Object.fromEntries(byPlan.map((p) => [p._id ?? "free", p.count])),
  });
});
