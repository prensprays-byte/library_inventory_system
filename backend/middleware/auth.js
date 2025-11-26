import jwt from "jsonwebtoken"

export default function auth(req, res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: "unauthorized" })
  try {
    const secret = process.env.JWT_SECRET || "devsecret"
    const payload = jwt.verify(token, secret)
    req.userId = payload.id
    req.userRole = payload.role
    req.userEmail = payload.email
    req.userName = payload.name
    next()
  } catch {
    res.status(401).json({ error: "invalid_token" })
  }
}
