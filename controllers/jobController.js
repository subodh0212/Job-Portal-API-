
const Job = require("../models/Job");
const User = require("../models/User");
const Application = require("../models/Application");

// 1. Create a job
const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      salary,
      type,
      skills
    } = req.body;

    const employer = await User.findById(req.user.id);

    if (!employer || employer.role !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Only employers can create jobs"
      });
    }

    const job = await Job.create({
      title,
      description,
      company: employer.companyName,
      location,
      salary,
      type,
      skills,
      postedBy: employer._id
    });

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error("Create job error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// 2. Get all open jobs with search, filters, sorting and pagination
const getAllJobs = async (req, res) => {
  try {
    const {
      search,
      location,
      type,
      skill,
      minSalary,
      maxSalary,
      sort,
      page = "1",
      limit = "10"
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      !Number.isInteger(limitNumber) ||
      pageNumber < 1 ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100"
      });
    }

    const filter = { status: "open" };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } }
      ];
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (type) {
      const allowedTypes = [
        "full-time",
        "part-time",
        "internship",
        "remote"
      ];

      if (!allowedTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid job type"
        });
      }

      filter.type = type;
    }

    if (skill) {
      filter.skills = { $regex: skill, $options: "i" };
    }

    if (minSalary !== undefined || maxSalary !== undefined) {
      const min =
        minSalary !== undefined ? Number(minSalary) : undefined;
      const max =
        maxSalary !== undefined ? Number(maxSalary) : undefined;

      if (
        (min !== undefined && (!Number.isFinite(min) || min < 0)) ||
        (max !== undefined && (!Number.isFinite(max) || max < 0)) ||
        (min !== undefined && max !== undefined && min > max)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary range"
        });
      }

      filter.salary = {};

      if (min !== undefined) filter.salary.$gte = min;
      if (max !== undefined) filter.salary.$lte = max;
    }

    const allowedSortFields = [
      "salary",
      "-salary",
      "createdAt",
      "-createdAt"
    ];

    if (sort && !allowedSortFields.includes(sort)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort value"
      });
    }

    const sortOption = sort
      ? {
          [sort.startsWith("-") ? sort.slice(1) : sort]:
            sort.startsWith("-") ? -1 : 1
        }
      : { createdAt: -1 };

    const total = await Job.countDocuments(filter);
    const pages = Math.ceil(total / limitNumber);

    const jobs = await Job.find(filter)
      .populate("postedBy", "name email companyName")
      .sort(sortOption)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    return res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      pages,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error("Get jobs error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// 3. Get a single job
const getJobById = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID"
      });
    }

    const job = await Job.findById(req.params.id)
      .populate("postedBy", "name email companyName");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error("Get job error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// 4. Update a job
const updateJob = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID"
      });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    if (
      !job.postedBy ||
      job.postedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own jobs"
      });
    }

    const allowedFields = [
      "title",
      "description",
      "location",
      "salary",
      "type",
      "skills",
      "status"
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    }

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: job
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error("Update job error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// 5. Delete a job and its applications
const deleteJob = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID"
      });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    if (
      !job.postedBy ||
      job.postedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own jobs"
      });
    }

    await Application.deleteMany({ job: job._id });
    await job.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Job and its applications deleted successfully"
    });
  } catch (error) {
    console.error("Delete job error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// 6. Close a job
const closeJob = async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID"
      });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    if (
      !job.postedBy ||
      job.postedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only close your own jobs"
      });
    }

    if (job.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Job is already closed"
      });
    }

    job.status = "closed";
    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job closed successfully",
      data: job
    });
  } catch (error) {
    console.error("Close job error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while closing job"
    });
  }
};

// 7. Get application statistics for one employer-owned job
const getJobStats = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID"
      });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    if (
      !job.postedBy ||
      job.postedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view statistics for your own jobs"
      });
    }

    const stats = await Application.aggregate([
      {
        $match: {
          job: job._id
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const applications = {
      applied: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0
    };

    stats.forEach(item => {
      applications[item._id] = item.count;
    });

    const totalApplications = stats.reduce(
      (total, item) => total + item.count,
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        jobId: job._id,
        title: job.title,
        totalApplications,
        applications
      }
    });
  } catch (error) {
    console.error("Job application statistics error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  closeJob,
  getJobStats
};
