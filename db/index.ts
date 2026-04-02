import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

let client: ReturnType<typeof postgres>
let db: ReturnType<typeof drizzle>

try {
  client = postgres(process.env.DATABASE_URL!, {
    ssl: "require",
    // DEBUG: Log connection attempts and issues
    onnotice: (notice) => console.log("[DB NOTICE]", notice),
    onclose: (conn) => console.log("[DB] Connection closed", conn),
    // DEBUG: Connection timeout to catch issues faster
    connect_timeout: 10,
    // DEBUG: Idle timeout
    idle_timeout: 20,
    // DEBUG: Maximum number of connections
    max: 10,
  })

  db = drizzle({ client, schema })
} catch (error) {
  console.error("[DB] Failed to initialize database connection:", error)
  // Create a mock database for offline mode
  db = {
    select: () => ({ from: () => ({ where: () => ({ limit: () => [] }) }) }),
    insert: () => ({ values: () => ({ returning: () => [] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
    delete: () => ({ where: () => ({ returning: () => [] }) }),
  } as any
}

export { db }
