
const express = require("express");

const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  closeJob,
  getJobStats
} = require("../controllers/jobController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Public: Get all jobs
router.get("/", getAllJobs);

// Job statistics — must come before /:id
router.get("/:id/stats", protect, authorize("employer"), getJobStats);

// Public: Get one job
router.get("/:id", getJobById);

// Employer only: Create a job
router.post("/", protect, authorize("employer"), createJob);

// Employer only: Close a job
router.patch("/:id/close", protect, authorize("employer"), closeJob);

// Employer only: Update a job
router.put("/:id", protect, authorize("employer"), updateJob);

// Employer only: Delete a job
router.delete("/:id", protect, authorize("employer"), deleteJob);

module.exports = router;
