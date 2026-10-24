
const express = require("express");

const {
  applyForJob,
  getMyApplications,
  getApplicationsForJob,
  updateApplicationStatus,
  withdrawApplication
} = require("../controllers/applicationController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Candidate: Apply for a job
router.post(
  "/jobs/:jobId",
  protect,
  authorize("candidate"),
  applyForJob
);

// Candidate: View their own applications
router.get(
  "/my",
  protect,
  authorize("candidate"),
  getMyApplications
);

// Employer: View applications for their own job
router.get(
  "/job/:jobId",
  protect,
  authorize("employer"),
  getApplicationsForJob
);

// Employer: Update application status
router.patch(
  "/:id/status",
  protect,
  authorize("employer"),
  updateApplicationStatus
);

// Candidate: Withdraw an application
router.delete(
  "/:id",
  protect,
  authorize("candidate"),
  withdrawApplication
);

module.exports = router;
