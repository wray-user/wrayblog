const mongoose = require('mongoose');

const StudyTopicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    minutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false },
);

const StudyMediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    coverUrl: {
      type: String,
      default: '',
      trim: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false },
);

const StudyRecordSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    studyDate: {
      type: String,
      required: true,
      index: true,
    },
    studyUser: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    topics: {
      type: [StudyTopicSchema],
      default: [],
    },
    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    media: {
      type: [StudyMediaSchema],
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
    createAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { strict: false },
);

StudyRecordSchema.pre('findOneAndUpdate', function updateTimestamp() {
  this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('StudyRecord', StudyRecordSchema);
