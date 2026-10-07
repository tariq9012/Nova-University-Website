import "dotenv/config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  schema: ["./db/schema.ts", "./db/cms-schema.ts", "./db/auth-schema.ts", "./db/student-schema.ts", "./db/faculty-schema.ts", "./db/admin-schema.ts"],
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
})
