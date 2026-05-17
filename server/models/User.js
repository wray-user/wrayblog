const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      default: 'Wray',
    },
    avatar: {
      type: String,
      default: '/icon/Mammon.png',
    },
    motto: {
      type: String,
      default: '',
    },
    canSeeLegacyPosts: {
      type: Boolean,
      default: false,
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
    strict: true,
  },
);

UserSchema.pre('findOneAndUpdate', function updateTimestamp() {
  this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('User', UserSchema);
