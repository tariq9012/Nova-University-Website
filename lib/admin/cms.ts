/** Pure helpers for the admin CMS forms (no imports so they are unit-testable without dependencies). */
export const cmsKinds=['news','events','announcements','scholarships'] as const
export type CmsKind=typeof cmsKinds[number]
export const isCmsKind=(v:string):v is CmsKind=>(cmsKinds as readonly string[]).includes(v)
export type Block={type:'paragraph'|'heading'|'list'|'quote';text?:string;items?:string[]}
/** Lossless-enough text form: "# heading", "> quote", "- item" lines (consecutive items form one list); blank line separates paragraphs. */
export function blocksToText(blocks:Block[]|null|undefined):string{return (blocks??[]).map(b=>b.type==='heading'?'# '+(b.text??''):b.type==='quote'?'> '+(b.text??''):b.type==='list'?(b.items??[]).map(i=>'- '+i).join('\n'):(b.text??'')).join('\n\n')}
export function textToBlocks(text:string):Block[]{const out:Block[]=[];for(const chunk of text.replace(/\r\n/g,'\n').split(/\n{2,}/)){const t=chunk.trim();if(!t)continue
  if(t.startsWith('# ')&&!t.includes('\n'))out.push({type:'heading',text:t.slice(2).trim()})
  else if(t.startsWith('> ')&&!t.includes('\n'))out.push({type:'quote',text:t.slice(2).trim()})
  else if(t.split('\n').every(l=>l.startsWith('- ')))out.push({type:'list',items:t.split('\n').map(l=>l.slice(2).trim()).filter(Boolean)})
  else out.push({type:'paragraph',text:t})}
 return out.slice(0,200)}
const nul=(v:unknown)=>v===''||v===undefined?null:v
const lines=(v:unknown)=>String(v??'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
/** Builds the exact strict payload the existing /api/v1/manage endpoints validate. Identity and audit fields are never included. */
export function cmsPayload(kind:CmsKind,v:Record<string,unknown>,isSample:boolean):Record<string,unknown>{
  const published=v.status==='published';const base={slug:v.slug,title:v.title,status:v.status,isSample,publishedAt:nul(v.publishedAt)??(published?new Date().toISOString():null),seoTitle:nul(v.seoTitle),seoDescription:nul(v.seoDescription)}
  if(kind==='scholarships')return {...base,description:nul(v.description),eligibility:lines(v.eligibility),coverage:nul(v.coverage),applicationProcess:nul(v.applicationProcess),requiredDocuments:lines(v.requiredDocuments),contactEmail:nul(v.contactEmail),degreeLevel:nul(v.degreeLevel),applicantType:v.applicantType||'all',opensOn:nul(v.opensOn),deadline:nul(v.deadline),isActive:Boolean(v.isActive)}
  const ed={...base,content:textToBlocks(String(v.content??'')),categoryId:nul(v.categoryId)}
  if(kind==='news')return {...ed,excerpt:nul(v.excerpt),imageUrl:nul(v.imageUrl),imageAlt:nul(v.imageAlt),authorName:nul(v.authorName),featured:Boolean(v.featured)}
  if(kind==='events')return {...ed,description:nul(v.description),startsAt:v.startsAt,endsAt:v.endsAt,timezone:v.timezone||'UTC',location:nul(v.location),organizer:nul(v.organizer),registrationUrl:nul(v.registrationUrl),imageUrl:nul(v.imageUrl),imageAlt:nul(v.imageAlt),featured:Boolean(v.featured),isCancelled:Boolean(v.isCancelled)}
  return {...ed,priority:Number(v.priority||0),audience:v.audience||'everyone',expiresAt:nul(v.expiresAt)}}
