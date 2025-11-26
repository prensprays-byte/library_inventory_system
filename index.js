import { spawn } from "child_process"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const backendIndex = path.resolve(__dirname, "backend", "index.js")

const child = spawn(process.execPath, [backendIndex], { stdio: "inherit", env: process.env })
child.on("exit", (code) => process.exit(code ?? 0))
child.on("error", (err) => {
  console.error("Failed to start backend:", err && err.message ? err.message : String(err))
  process.exit(1)
})
