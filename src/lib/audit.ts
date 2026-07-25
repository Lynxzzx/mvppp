import { AuditLog } from "@/models/AuditLog";
import { Session } from "@/lib/auth";

/**
 * Registra uma ação crítica na trilha de auditoria.
 * Nunca lança: falha de auditoria não deve derrubar a operação principal,
 * mas é registrada no log do servidor.
 */
export async function audit(
  session: Session,
  action: string,
  entity: string,
  entityId?: string,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    await AuditLog.create({
      tenantId: session.tenantId,
      userId: session.userId,
      userName: session.name,
      action,
      entity,
      entityId,
      meta,
    });
  } catch (err) {
    console.error("[audit] falha ao registrar auditoria", err);
  }
}
