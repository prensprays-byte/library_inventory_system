import { Router } from "express"
import mongoose from "mongoose"
import Book from "../models/Book.js"
import auth from "../middleware/auth.js"

const router = Router()
const memBooks = (globalThis.__books ||= [])
let memSeq = (globalThis.__memSeq ||= 1)
function dbReady() { return mongoose.connection && mongoose.connection.readyState === 1 }
function memFindAll(query) {
  let items = memBooks.slice()
  if (query.q) items = items.filter((b) => (b.title || "").toLowerCase().includes(String(query.q).toLowerCase()))
  if (query.author) items = items.filter((b) => (b.author || "").toLowerCase().includes(String(query.author).toLowerCase()))
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return items
}
function memFindById(id) { return memBooks.find((b) => String(b.id) === String(id)) }
function memSeed() {
  if (memBooks.length) return
  const now = new Date().toISOString()
  memBooks.push({ id: String(memSeq++), title: "The Pragmatic Programmer", description: "Classic software craftsmanship.", coverUrl: "/logo.webp", publishedAt: new Date("1999-10-30").toISOString(), genre: "Tech", author: "Andrew Hunt", quantity: 3, ratingSum: 0, ratingCount: 0, createdAt: now })
  memBooks.push({ id: String(memSeq++), title: "Clean Code", description: "Writing code that works.", coverUrl: "/logo.webp", publishedAt: new Date("2008-08-01").toISOString(), genre: "Tech", author: "Robert C. Martin", quantity: 2, ratingSum: 0, ratingCount: 0, createdAt: now })
  globalThis.__memSeq = memSeq
}

router.get("/", async (req, res) => {
  const { q = "", author = "", page = 1, limit = 20 } = req.query
  try {
    if (dbReady()) {
      const query = {}
      if (q) query.title = { $regex: q, $options: "i" }
      if (author) query.author = { $regex: author, $options: "i" }
      const skip = (Number(page) - 1) * Number(limit)
      const books = await Book.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      return res.json(books)
    }
  } catch { void 0 }
  memSeed()
  const all = memFindAll({ q, author })
  const start = (Number(page) - 1) * Number(limit)
  const pageItems = all.slice(start, start + Number(limit))
  res.json(pageItems)
})

router.get("/:id", async (req, res) => {
  try {
    if (dbReady()) {
      const book = await Book.findById(req.params.id)
      if (!book) return res.status(404).json({ error: "not_found" })
      return res.json(book)
    }
  } catch { void 0 }
  memSeed()
  const book = memFindById(req.params.id)
  if (!book) return res.status(404).json({ error: "not_found" })
  res.json(book)
})

router.post("/:id/purchase", auth, async (req, res) => {
  try {
    if (dbReady()) {
      const book = await Book.findById(req.params.id)
      if (!book) return res.status(404).json({ error: "not_found" })
      const qty = typeof book.quantity === "number" ? book.quantity : 1
      if (qty <= 0) return res.status(400).json({ error: "out_of_stock" })
      book.quantity = qty - 1
      await book.save()
      return res.json({ ok: true, quantity: book.quantity })
    }
  } catch { void 0 }
  memSeed()
  const book = memFindById(req.params.id)
  if (!book) return res.status(404).json({ error: "not_found" })
  const qty = typeof book.quantity === "number" ? book.quantity : 1
  if (qty <= 0) return res.status(400).json({ error: "out_of_stock" })
  book.quantity = qty - 1
  res.json({ ok: true, quantity: book.quantity })
})

// ratings removed

export default router
