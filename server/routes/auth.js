const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/demo", authController.createDemoAccount);
router.get("/verify", auth, authController.verify);

module.exports = router;
