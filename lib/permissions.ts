/** Pure permission catalogue and resolution rules. No I/O so it can be unit tested without a database. */
export const PERMISSIONS=['users.view','users.manage','students.view','students.manage','faculty.view','faculty.manage','academics.view','academics.manage','grades.view','grades.manage','applications.view','applications.manage','cms.view','cms.manage','finance.view','finance.manage','audit.view','settings.manage'] as const
export type Permission=typeof PERMISSIONS[number]
export const isPermission=(v:string):v is Permission=>(PERMISSIONS as readonly string[]).includes(v)
/** `*.manage` implies the matching `*.view` so a manager can always see what they manage. */
export function withImplied(granted:Iterable<string>){const out=new Set<string>(granted);for(const k of [...out])if(k.endsWith('.manage'))out.add(k.replace(/\.manage$/,'.view'));return out}
/** Role grants + user allow overrides, minus user deny overrides. Deny always wins. Unknown keys are ignored. */
export function resolvePermissions(roleGrants:string[],overrides:{permissionKey:string;effect:string}[]):Set<Permission>{
  const granted=new Set<string>(roleGrants);for(const o of overrides)if(o.effect==='allow')granted.add(o.permissionKey)
  const denied=new Set(overrides.filter(o=>o.effect==='deny').map(o=>o.permissionKey))
  const result=new Set<Permission>()
  for(const k of withImplied(granted))if(isPermission(k)&&!denied.has(k)&&!(k.endsWith('.view')&&denied.has(k)))result.add(k)
  return result
}
