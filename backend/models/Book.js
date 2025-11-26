import mongoose from "mongoose"

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    coverUrl: { type: String, required: true, trim: true },
    publishedAt: { type: Date, required: true },
    genre: { type: String, required: true, trim: true },
    author: { type: String, trim: true },
    isbn: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    ratingSum: { type: Number, default: 0, min: 0 },
    ratingCount: { type: Number, default: 0, min: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
)

schema.index({ title: 1, author: 1 })

export default mongoose.model("Book", schema)
