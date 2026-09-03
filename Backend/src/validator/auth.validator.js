import { body, validationResult } from "express-validator";


export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    return res.status(400).json({
      success: false,
      message: errorArray[0]?.msg || "Validation error",
      errors: errorArray
    });
  }

  next();
};


export const registerValidationRules = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .custom((value) => {
      const normalized = (value || "").toLowerCase().trim();
      if (!normalized.endsWith("@gmail.com")) {
        throw new Error("Please use a valid Gmail address to create your Aether AI account.");
      }
      const localPart = normalized.slice(0, -10);
      if (localPart.length < 6 || localPart.length > 30) {
        throw new Error("Gmail username must be between 6 and 30 characters long.");
      }
      if (!/^[a-z0-9.]+$/.test(localPart)) {
        throw new Error("Gmail username can only contain letters, numbers, and periods.");
      }
      if (localPart.startsWith(".") || localPart.endsWith(".")) {
        throw new Error("Gmail username cannot start or end with a period.");
      }
      if (localPart.includes("..")) {
        throw new Error("Gmail username cannot contain consecutive periods.");
      }
      return true;
    }),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

    validate
];

export const loginValidationRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
    validate
];

