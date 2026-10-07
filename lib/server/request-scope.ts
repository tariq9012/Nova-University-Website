import {AsyncLocalStorage} from 'node:async_hooks'
import type {AuthUser} from './auth'
const scope=new AsyncLocalStorage<{auth?:Promise<AuthUser|null>;resources?:Map<string,Promise<unknown>>}>()
export const requestScope=scope
