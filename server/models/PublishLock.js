const mongoose = require('mongoose');

const PublishLockSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    holder: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { strict: true },
);

PublishLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

PublishLockSchema.pre('findOneAndUpdate', function updateTimestamp() {
  this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('PublishLock', PublishLockSchema);
