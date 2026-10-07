import {getIntakes} from '@/db/queries/cms'
import {json,withApi} from '@/lib/server/api'
export const GET=withApi(async()=>json({success:true,data:await getIntakes()}))
