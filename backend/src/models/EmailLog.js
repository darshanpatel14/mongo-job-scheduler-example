const mongoose = require("mongoose");

const EmailLogSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  jobId: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("EmailLog", EmailLogSchema);
