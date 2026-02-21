const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({

  foodName: {
    type: String,
    required: true
  },

  quantity: {
    type: String,
    required: true
  },

  location: {
    type: String,
    required: true
  },

  cookingTime: {
    type: Date,
    required: true
  },

  safeDurationHours: {
    type: Number,
    required: true
  },

  expiryAt: {
    type: Date
  },

  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  status: {
    type: String,
    enum: ["available", "accepted", "picked", "expired"],
    default: "available"
  },

  volunteerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
},

ngoId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
},

pickupStatus: {
  type: String,
  enum: ["pending", "assigned", "picked"],
  default: "pending"
}

}, { timestamps: true });

module.exports = mongoose.model("Food", foodSchema);