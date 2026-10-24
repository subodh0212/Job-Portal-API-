
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true
    },

    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true
    },

    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true
    },

    location: {
      type: String,
      required: [true, "Job location is required"],
      trim: true
    },

    type: {
      type: String,
      required: [true, "Job type is required"],
      enum: ["full-time", "part-time", "internship", "remote"]
    },

    salary: {
      type: Number,
      required: [true, "Salary is required"],
      min: [0, "Salary cannot be negative"]
    },
    skills: {
      type: [String],
      default: []
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open"
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
