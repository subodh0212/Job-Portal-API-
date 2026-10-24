
const express = require("express");
const { body, validationResult } = require("express-validator");

const {
  register,
  login,
  getMe
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Validate registration data
const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("role")
    .isIn(["candidate", "employer"])
    .withMessage("Role must be candidate or employer"),

  body("companyName").custom((value, { req }) => {
    if (
      req.body.role === "employer" &&
      (typeof value !== "string" || !value.trim())
    ) {
      throw new Error("Company name is required for employers");
    }

    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    next();
  }
];

// Validate login data
const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    next();
  }
];

// Register a new user
router.post("/register", validateRegister, register);

// Login an existing user
router.post("/login", validateLogin, login);

// Get the logged-in user's profile
router.get("/me", protect, getMe);

module.exports = router;
