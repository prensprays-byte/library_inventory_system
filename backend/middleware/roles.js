export function requireRole(role) {
  return (req, res, next) => {
    if (!req.userId) return res.status(401).json({ error: "unauthorized" })
    const userRole = req.userRole
    if (userRole !== role) return res.status(403).json({ error: "forbidden" })
    next()
  }
}
