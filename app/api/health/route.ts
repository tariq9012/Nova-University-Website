import { sql } from "drizzle-orm"
import { db } from "@/db"
import { json, withApi } from "@/lib/server/api"
export const GET = withApi(async () => { await db.execute(sql`select 1`); return json({ status: "ok", database: "connected" }) })
