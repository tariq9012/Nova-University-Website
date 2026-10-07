import {pgTable,uuid,varchar,text,timestamp,primaryKey,index,check} from 'drizzle-orm/pg-core'
import {sql} from 'drizzle-orm'
import {users,roles} from './schema'

/** Permission catalogue. Keys are seeded by migration 0009 and db/seed-admin.ts. */
export const permissions=pgTable('permissions',{
  key:varchar('key',{length:60}).primaryKey(),
  description:text('description').notNull(),
  createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull()
})

/** Permissions granted through the existing roles table (no second RBAC system). */
export const rolePermissions=pgTable('role_permissions',{
  roleId:uuid('role_id').notNull().references(()=>roles.id,{onDelete:'cascade'}),
  permissionKey:varchar('permission_key',{length:60}).notNull().references(()=>permissions.key,{onDelete:'cascade'})
},t=>[primaryKey({columns:[t.roleId,t.permissionKey]})])

/** Per-user exceptions on top of role grants. A deny always wins over any grant. */
export const userPermissionOverrides=pgTable('user_permission_overrides',{
  userId:uuid('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
  permissionKey:varchar('permission_key',{length:60}).notNull().references(()=>permissions.key,{onDelete:'cascade'}),
  effect:varchar('effect',{length:5}).notNull(),
  reason:text('reason'),
  grantedBy:uuid('granted_by').references(()=>users.id,{onDelete:'set null'}),
  createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull()
},t=>[primaryKey({columns:[t.userId,t.permissionKey]}),check('permission_override_effect',sql`${t.effect} in ('allow','deny')`),index('permission_override_user_idx').on(t.userId)])
