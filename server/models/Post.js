const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    excerpt: {
      type: String,
      default: '',
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    category: {
      type: String,
      default: '未分类',
    },
    categorySlug: {
      type: String,
      default: 'uncategorized',
      index: true,
    },
    techTopic: {
      type: String,
      default: '',
      index: true,
    },
    techKind: {
      type: String,
      enum: ['question', 'note'],
      default: 'question',
      index: true,
    },
    noteOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    owner: {
      type: String,
      default: 'admin',
      index: true,
    },
    authorName: {
      type: String,
      default: 'Wray',
    },
    authorAvatar: {
      type: String,
      default: '/icon/Mammon.png',
    },
    image: {
      type: String,
      default: '/img/sky.jpg',
    },
    videos: {
      type: [String],
      default: [],
    },
    readTime: {
      type: String,
      default: '3 min',
    },
    date: {
      type: String,
      default: '',
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
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
    published: {
      type: Boolean,
      default: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
      index: true,
    },
    history: {
      type: [
        {
          at: {
            type: Date,
            default: Date.now,
          },
          message: {
            type: String,
            trim: true,
            maxlength: 160,
            default: '',
          },
        },
      ],
      default: [],
    },
    createAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strict: false,
  },
);

PostSchema.pre('findOneAndUpdate', function updateTimestamp() {
  this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('Post', PostSchema);
