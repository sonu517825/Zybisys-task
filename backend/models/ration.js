const mongoose = require("mongoose");

const rationSchema = mongoose.Schema(
  {
    packetId: { type: String, trim: true, required: true, unique: true }, // packetType[0] + packetId  => F0 , F1 .....
    packetType: {
      type: String,
      trim: true,
      required: true,
      enum: ["Food", "Water"],
    },
    packetContent: String,
    qty: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "500 Calories",
        "1000 Calories",
        "1500 Calories",
        "2000 Calories",
        "1 Litres",
        "2 Litres",
      ],
    },
    expiry: Date,
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const ration = mongoose.model("ration", rationSchema);

module.exports = ration;
