import { prisma } from "@/lib/prisma"
import { AuditLog } from "@prisma/client"

interface CreateAuditLogParams {
  userId: string
  action: string
  target?: string
  targetId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<AuditLog> {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      target: params.target,
      targetId: params.targetId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress,
    },
  })
}

export async function createNotification(params: {
  userId: string
  title: string
  message: string
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "TASK" | "ARCHIVE" | "CHAT" | "USER"
  link?: string
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || "INFO",
      link: params.link,
    },
  })
}
