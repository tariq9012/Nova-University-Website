import {randomBytes,scrypt,timingSafeEqual,createHash} from 'node:crypto'
const options={N:131072,r:8,p:1,maxmem:256*1024*1024}
const derive=(password:string,salt:string)=>new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,64,options,(err,key)=>err?reject(err):resolve(key)))
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');const key=await derive(password,salt);return `scrypt$131072$8$1$${salt}$${key.toString('hex')}`}
let dummy:Promise<string>|undefined
export async function verifyPassword(password:string,encoded:string|null){if(!encoded){dummy??=hashPassword(randomBytes(32).toString('hex'));encoded=await dummy}const parts=encoded.split('$');if(parts.length!==6||parts.slice(0,4).join('$')!=='scrypt$131072$8$1'||!/^[a-f0-9]{32}$/.test(parts[4])||!/^[a-f0-9]{128}$/.test(parts[5]))return false;const actual=await derive(password,parts[4]);return timingSafeEqual(actual,Buffer.from(parts[5],'hex'))}
export const randomToken=()=>randomBytes(32).toString('hex')
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex')
