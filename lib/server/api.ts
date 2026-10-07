import {requestScope} from './request-scope'
import { NextResponse } from "next/server"
import { z } from "zod"

export class AppError extends Error { constructor(public code: string, message: string, public status: number) { super(message) } }
export class NotFoundError extends AppError { constructor(message = "Resource not found") { super("RESOURCE_NOT_FOUND", message, 404) } }
export class ValidationError extends AppError { constructor(message: string) { super("VALIDATION_ERROR", message, 400) } }
export class DatabaseError extends AppError { constructor() { super("DATABASE_ERROR", "Database request failed", 500) } }
export const paginationSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) })
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug")
export function parseParams<T extends z.ZodType>(schema: T, input: unknown) { const result = schema.safeParse(input); if (!result.success) throw new ValidationError(result.error.issues[0]?.message ?? "Invalid request") ; return result.data }
export function collection<T>(data: T[], page: number, pageSize: number, total: number) { return { success: true as const, data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } } }
export function success<T>(data: T) { return { success: true as const, data } }
export function withApi<T extends unknown[]>(handler: (...args: T) => Promise<NextResponse | Response>) { return async (...args: T) => { try { return await requestScope.run({},()=>handler(...args)) } catch (error) { const appError = error instanceof AppError ? error : new AppError("INTERNAL_SERVER_ERROR", "An unexpected error occurred", 500); console.error("[nova] API request failed", { code: appError.code, status: appError.status }); return NextResponse.json({ success: false, error: { code: appError.code, message: appError.message } }, { status: appError.status, headers: { "Cache-Control": "no-store" } }) } } }
export function json<T>(body: T, init?: ResponseInit) { return NextResponse.json(body, init) }
export const searchSchema = z.string().trim().max(100).optional()
export const sortSchema = z.enum(["name", "-name", "code", "-code", "title", "-title", "duration", "degreeLevel"]).default("name")
