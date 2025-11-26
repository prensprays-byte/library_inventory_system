import { Router } from "express"
import mongoose from "mongoose"
import Book from "../models/Book.js"
import auth from "../middleware/auth.js"
import { requireRole } from "../middleware/roles.js"

const router = Router()
const memBooks = (globalThis.__books ||= [])
let memSeq = (globalThis.__memSeq ||= 1)
function dbReady() { return mongoose.connection && mongoose.connection.readyState === 1 }
function memFindById(id) { return memBooks.find((b) => String(b.id) === String(id)) }
function memCreate(payload) { const now = new Date().toISOString(); const b = { id: String(memSeq++), createdAt: now, ...payload }; memBooks.unshift(b); globalThis.__memSeq = memSeq; return b }
function memUpdate(id, changes) { const b = memFindById(id); if (!b) return null; Object.assign(b, changes); return b }
function memDelete(id) { const i = memBooks.findIndex((b) => String(b.id) === String(id)); if (i === -1) return null; const d = memBooks.splice(i, 1)[0]; return d }

router.use(auth)
router.use(requireRole("admin"))

router.get("/", async (req, res) => {
  if (dbReady()) {
    const books = await Book.find({}).sort({ createdAt: -1 })
    return res.json(books)
  }
  res.json(memBooks.slice())
})

router.post("/", async (req, res) => {
  const toStr = (v) => (typeof v === "string" ? v.trim() : v)
  const coverUrl = toStr(req.body.coverUrl)
  const title = toStr(req.body.title)
  const genre = toStr(req.body.genre)
  const description = toStr(req.body.description)
  const publishedAtRaw = req.body.publishedAt
  const quantityRaw = req.body.quantity
  const missing = []
  if (!coverUrl) missing.push("coverUrl")
  if (!title) missing.push("title")
  if (!genre) missing.push("genre")
  if (!description) missing.push("description")
  if (!publishedAtRaw) missing.push("publishedAt")
  if (missing.length) return res.status(400).json({ error: "missing_fields", missing })
  const date = new Date(publishedAtRaw)
  if (isNaN(date.getTime())) return res.status(400).json({ error: "invalid_publishedAt" })
  let quantity
  if (quantityRaw !== undefined && quantityRaw !== null && String(quantityRaw).trim() !== "") {
    quantity = Number(quantityRaw)
    if (!Number.isFinite(quantity) || quantity < 0) return res.status(400).json({ error: "invalid_quantity" })
  }
  const createPayload = { coverUrl, title, publishedAt: date.toISOString(), genre, description }
  if (quantity !== undefined) createPayload.quantity = quantity
  if (dbReady()) {
    const book = await Book.create(createPayload)
    return res.status(201).json(book)
  }
  const book = memCreate(createPayload)
  res.status(201).json(book)
})

router.get("/:id", async (req, res) => {
  if (dbReady()) {
    const book = await Book.findById(req.params.id)
    if (!book) return res.status(404).json({ error: "not_found" })
    return res.json(book)
  }
  const book = memFindById(req.params.id)
  if (!book) return res.status(404).json({ error: "not_found" })
  res.json(book)
})

router.put("/:id", async (req, res) => {
  if (dbReady()) {
    const updated = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) return res.status(404).json({ error: "not_found" })
    return res.json(updated)
  }
  const updated = memUpdate(req.params.id, req.body)
  if (!updated) return res.status(404).json({ error: "not_found" })
  res.json(updated)
})

router.delete("/:id", async (req, res) => {
  if (dbReady()) {
    const deleted = await Book.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ error: "not_found" })
    return res.json({ ok: true })
  }
  const deleted = memDelete(req.params.id)
  if (!deleted) return res.status(404).json({ error: "not_found" })
  res.json({ ok: true })
})

// Reservations feature removed

export default router
