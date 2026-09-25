import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Use a connection string from the environment.
// Supabase provides a pooled "Transaction" connection string (port 6543) for serverless
// and a direct "Session" string (port 5432) for long-lived processes (migrations, seeds).
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function getDb() {
  if (_db) return _db

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase connection string to .env.local."
    )
  }

  const client = postgres(connectionString, {
    prepare: false,
    idle_timeout: 20,
    max: 10,
    ssl: "require",
  })

  _db = drizzle(client, { schema })
  return _db
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const instance = getDb()
    const val = (instance as any)[prop]
    return typeof val === "function" ? val.bind(instance) : val
  },
})

export { schema }
