const mongoose = require("mongoose");

const ModuleSchema = new mongoose.Schema({
  courseType: {
    type: String,
    enum: ["free", "premium"],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true,
    unique: true // Ensure modules have a unique order
  }
});

module.exports = mongoose.model("Module", ModuleSchema);
