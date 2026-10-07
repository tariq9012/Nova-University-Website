import {forbidden,redirect} from 'next/navigation'
import {sql} from 'drizzle-orm'
import {db} from '@/db'
import {getAuth,requireAuth,requireVerified,type AuthUser} from './auth'
import {AppError} from './api'
import {resolvePermissions,type Permission} from '../permissions'

/** Permissions are always recomputed from the database for the session user; nothing from the client is used. */
async function loadPermissions(userId:string){
  const [grants,overrides]=await Promise.all([
    db.execute(sql`select distinct rp.permission_key as key from user_roles ur join role_permissions rp on rp.role_id=ur.role_id where ur.user_id=${userId}::uuid`),
    db.execute(sql`select permission_key as "permissionKey",effect from user_permission_overrides where user_id=${userId}::uuid`)])
  return resolvePermissions(grants.rows.map(r=>String(r.key)),overrides.rows as {permissionKey:string;effect:string}[])
}
export const permissionsForUser=loadPermissions
const memo=new WeakMap<AuthUser,Promise<Set<Permission>>>()
export function adminPermissions(u:AuthUser){let p=memo.get(u);if(!p){p=loadPermissions(u.id);memo.set(u,p)}return p}

/** API guard: authentication → active account (enforced by the session query) → admin role → verified email → permission. */
export async function requireAdminPermission(permission:Permission):Promise<AuthUser>{
  const u=await requireAuth()
  if(!u.roles.includes('admin'))throw new AppError('FORBIDDEN','Your account does not have access to this area.',403)
  requireVerified(u)
  if(!(await adminPermissions(u)).has(permission))throw new AppError('FORBIDDEN','Your administrator account does not have the required permission.',403)
  return u
}
export const requirePermission=requireAdminPermission
/** Server-component guard: redirects anonymous users, renders the forbidden page for everyone else who lacks access. */
export async function adminPage(permission?:Permission):Promise<AuthUser>{
  const u=await getAuth();if(!u)redirect('/login')
  if(!u.roles.includes('admin')||!u.emailVerifiedAt)forbidden()
  if(permission&&!(await adminPermissions(u)).has(permission))forbidden()
  return u
}
