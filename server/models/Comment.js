const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    postSlug: {
      type: String,
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    nickname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    email: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedBy: {
      type: [String],
      default: [],
      select: false,
    },
    createAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strict: true,
  },
);

module.exports = mongoose.model('Comment', CommentSchema);
