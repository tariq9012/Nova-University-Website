import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

import * as faculty from './faculty-schema'
import * as student from './student-schema'
import * as auth from './auth-schema'
import * as cms from "./cms-schema"
import * as admin from './admin-schema'

const connectionString = process.env.DATABASE_URL
const sql = neon(connectionString || "postgresql://user:password@localhost/db")
export const db = drizzle(sql, { schema: {...schema,...cms,...auth,...student,...faculty,...admin} })
