const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    value: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastNotifiedValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { strict: true },
);

CounterSchema.pre('findOneAndUpdate', function updateTimestamp() {
  this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('Counter', CounterSchema);
