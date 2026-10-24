
const mongoose = require("mongoose");
const Job = require("../models/Job");
const Application = require("../models/Application");

// 1. Apply for a job (candidate only)
const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID"
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    if (job.status !== "open") {
      return res.status(409).json({
        success: false,
        message: "Cannot apply to a closed job"
      });
    }

    const existingApplication = await Application.findOne({
      job: jobId,
      candidate: req.user.id
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "You have already applied to this job"
      });
    }

    const application = await Application.create({
      job: jobId,
      candidate: req.user.id,
      coverLetter: coverLetter || ""
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already applied to this job"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error("Apply for job error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// 2. Get applications belonging to the logged-in candidate
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      candidate: req.user.id
    })
      .populate("job")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error("Get my applications error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// 3. Get applications for a job owned by the logged-in employer
const getApplicationsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID"
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only view applications for your own jobs"
      });
    }

    const allowedStatuses = [
      "applied",
      "shortlisted",
      "rejected",
      "hired"
    ];

    const filter = { job: jobId };

    if (req.query.status) {
      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid application status"
        });
      }

      filter.status = req.query.status;
    }

    const applications = await Application.find(filter)
      .populate("candidate", "name email")
      .populate("job")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error("Get applications for job error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// 4. Update an application's status
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID"
      });
    }

    const allowedStatuses = [
      "applied",
      "shortlisted",
      "rejected",
      "hired"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application status"
      });
    }

    const application = await Application.findById(id).populate("job");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    if (
      !application.job.postedBy ||
      application.job.postedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update applications for your own jobs"
      });
    }

    const transitions = {
      applied: ["shortlisted", "rejected"],
      shortlisted: ["hired", "rejected"],
      rejected: [],
      hired: []
    };

    if (
      application.status !== status &&
      !transitions[application.status].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${application.status} to ${status}`
      });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: application
    });
  } catch (error) {
    console.error("Update application status error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// 5. Withdraw an application (candidate only)
const withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID"
      });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    if (application.candidate.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only withdraw your own applications"
      });
    }

    if (application.status !== "applied") {
      return res.status(400).json({
        success: false,
        message: "Only applications with applied status can be withdrawn"
      });
    }

    await application.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Application withdrawn successfully"
    });
  } catch (error) {
    console.error("Withdraw application error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getApplicationsForJob,
  updateApplicationStatus,
  withdrawApplication
};
