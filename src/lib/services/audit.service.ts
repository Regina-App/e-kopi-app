import { createAdminClient } from '@/lib/supabase/admin'
import type { ActorType, Json } from '@/lib/types/database'

export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  APPROVE_REGISTRATION: 'APPROVE_REGISTRATION',
  REJECT_REGISTRATION: 'REJECT_REGISTRATION',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  REQUEST_OTP: 'REQUEST_OTP',
  VERIFY_OTP: 'VERIFY_OTP',
  REQUEST_LEAVE: 'REQUEST_LEAVE',
  APPROVE_LEAVE: 'APPROVE_LEAVE',
  REJECT_LEAVE: 'REJECT_LEAVE',
  CANCEL_LEAVE: 'CANCEL_LEAVE',
  REQUEST_LOAN: 'REQUEST_LOAN',
  APPROVE_LOAN: 'APPROVE_LOAN',
  REJECT_LOAN: 'REJECT_LOAN',
  CANCEL_LOAN: 'CANCEL_LOAN',
} as const

export type AuditActionType = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

export interface LogActionParams {
  actorType: ActorType
  actorId?: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  oldValues?: Json | Record<string, unknown> | null
  newValues?: Json | Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export async function logAction(params: LogActionParams) {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('audit_logs').insert({
      actor_type: params.actorType,
      actor_id: params.actorId || null,
      action: params.action,
      target_type: params.targetType || null,
      target_id: params.targetId ? String(params.targetId) : null,
      old_values: (params.oldValues as Json) ?? null,
      new_values: (params.newValues as Json) ?? null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    }).select().single()

    if (error) {
      console.error('[AuditService] Failed to insert audit log:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true, log: data }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown audit log error'
    console.error('[AuditService] Unexpected error inserting audit log:', errorMsg)
    return { success: false, error: errorMsg }
  }
}
