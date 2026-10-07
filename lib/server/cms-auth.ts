import {requireStudent} from './auth'
import {requireAdminPermission} from './admin-auth'
/** CMS editing requires the cms.manage permission (implied view). */
export async function requireCmsEditor(){return requireAdminPermission('cms.manage')}
export const requireApplicant=requireStudent
