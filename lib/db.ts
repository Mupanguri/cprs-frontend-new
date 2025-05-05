import { Pool } from "pg"

// Create a PostgreSQL connection pool
export const db = new Pool({
  user: process.env.POSTGRES_USER || "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  database: process.env.POSTGRES_DATABASE || "stagnes_database",
  password: process.env.POSTGRES_PASSWORD || "mint",
  port: Number.parseInt(process.env.POSTGRES_PORT || "5432"),
})

// Initialize the database connection
export const initDb = async () => {
  try {
    await db.connect()
    console.log("Connected to PostgreSQL database")
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error)
    throw error
  }
}
