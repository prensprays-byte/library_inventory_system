import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import authRoutes from "./routes/auth.js"
import adminBookRoutes from "./routes/books.js"
import publicBookRoutes from "./routes/books.public.js"
import User from "./models/User.js"
import bcrypt from "bcryptjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, ".env") })

const app = express()

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  const connectSrc = process.env.CSP_CONNECT_SRC || "'self' https: http:"
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; connect-src ${connectSrc}; img-src 'self' data: blob: https: http:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'`
  )
  next()
})

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" })
})

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.json({ ok: true })
})

const frontendDir = path.resolve(__dirname, "../dist")
const indexPath = path.join(frontendDir, "index.html")
if (fs.existsSync(frontendDir)) app.use(express.static(frontendDir))
app.get("/favicon.ico", (req, res) => { res.status(204).end() })
app.get("/", (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(200).send("<html><body><h1>Service is running</h1><p>Frontend not built. Please run npm run build.</p></body></html>")
  }
})

app.use("/api/auth", authRoutes)
app.use("/api/books", adminBookRoutes)
app.use("/api/public/books", publicBookRoutes)

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next()
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send("Not Found")
  }
})

const port = Number(process.env.PORT || 5000)
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).catch(() => {})
function start(p, retries = 10) {
  const server = app.listen(p, () => {
    console.log(`Server listening on http://localhost:${p}`)
  })
  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE" && retries > 0) {
      const next = p + 1
      console.error(`Port ${p} is already in use. Trying ${next}...`)
      start(next, retries - 1)
      return
    }
    console.error("Server error:", err)
    process.exit(1)
  })
}
start(port)
mongoose.set("bufferCommands", false)

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || "Admin"
  if (!email || !password) return
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    const exists = await User.findOne({ email }).catch(() => null)
    if (!exists) {
      const passwordHash = await bcrypt.hash(password, 10).catch(() => null)
      if (!passwordHash) return
      await User.create({ name, email, passwordHash, role: "admin" }).catch(() => null)
      console.log(`Admin user seeded: ${email}`)
    }
  }
}

function trySeedAdmin(retries = 10) {
  ensureAdmin()
  if (retries > 0) setTimeout(() => trySeedAdmin(retries - 1), 2000)
}

trySeedAdmin()
