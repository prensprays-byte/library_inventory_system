import { Router } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import User from "../models/User.js"
import auth from "../middleware/auth.js"

const router = Router()
const memoryUsers = []
let memSeq = 1
function memFindByEmail(email) {
  return memoryUsers.find((u) => u.email === email)
}
function memFindById(id) {
  return memoryUsers.find((u) => String(u.id) === String(id))
}
function memCreate({ name, email, passwordHash, role }) {
  const user = { id: String(memSeq++), name, email, passwordHash, role }
  memoryUsers.push(user)
  return user
}
function dbReady() {
  return mongoose.connection && mongoose.connection.readyState === 1
}

// Seed an in-memory admin for development when DB is not connected
if (!dbReady()) {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminName = process.env.ADMIN_NAME || "Admin"
  if (adminEmail && adminPassword && !memFindByEmail(adminEmail)) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10)
    memCreate({ name: adminName, email: adminEmail, passwordHash, role: "admin" })
  }
}

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: "missing_fields" })
  try {
    if (dbReady()) {
      const exists = await User.findOne({ email })
      if (exists) return res.status(409).json({ error: "email_exists" })
      const passwordHash = await bcrypt.hash(password, 10)
      const user = await User.create({ name, email, passwordHash, role: role === "admin" ? "admin" : "reader" })
      const secret = process.env.JWT_SECRET || "devsecret"
      const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name }, secret, { expiresIn: "7d" })
      return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
    }
  } catch { void 0 }
  const existsMem = memFindByEmail(email)
  if (existsMem) return res.status(409).json({ error: "email_exists" })
  const passwordHash = await bcrypt.hash(password, 10)
  const user = memCreate({ name, email, passwordHash, role: role === "admin" ? "admin" : "reader" })
  const secret = process.env.JWT_SECRET || "devsecret"
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email, name: user.name }, secret, { expiresIn: "7d" })
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: "missing_fields" })
  try {
    if (dbReady()) {
      const user = await User.findOne({ email })
      if (!user) return res.status(401).json({ error: "invalid_credentials" })
      let ok = false
      if (user.passwordHash) {
        ok = await bcrypt.compare(password, user.passwordHash)
      } else if (user.password) {
        if (user.password === password) {
          const passwordHash = await bcrypt.hash(password, 10)
          user.passwordHash = passwordHash
          user.password = undefined
          await user.save()
          ok = true
        }
      }
      if (!ok) return res.status(401).json({ error: "invalid_credentials" })
      const secret = process.env.JWT_SECRET || "devsecret"
      const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name }, secret, { expiresIn: "7d" })
      return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
    }
  } catch { void 0 }
  const mem = memFindByEmail(email)
  if (!mem) return res.status(401).json({ error: "invalid_credentials" })
  const ok = await bcrypt.compare(password, mem.passwordHash)
  if (!ok) return res.status(401).json({ error: "invalid_credentials" })
  const secret = process.env.JWT_SECRET || "devsecret"
  const token = jwt.sign({ id: mem.id, role: mem.role, email: mem.email, name: mem.name }, secret, { expiresIn: "7d" })
  res.json({ token, user: { id: mem.id, name: mem.name, email: mem.email, role: mem.role } })
})

router.get("/me", auth, async (req, res) => {
  try {
    if (dbReady()) {
      const user = await User.findById(req.userId).select("name email role")
      if (!user) return res.status(404).json({ error: "not_found" })
      return res.json({ id: user._id, name: user.name, email: user.email, role: user.role })
    }
  } catch { void 0 }
  const mem = memFindById(req.userId)
  if (!mem) return res.status(404).json({ error: "not_found" })
  res.json({ id: mem.id, name: mem.name, email: mem.email, role: mem.role })
})

export default router
