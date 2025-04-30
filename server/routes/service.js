const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const auth = require("../middleware/auth");
const upload = require("../config/multer");

// Protected routes
router.post("/", auth, upload.single('image'), serviceController.createService);
router.put("/:id", auth, upload.single('image'), serviceController.updateService);
router.delete("/:id", auth, serviceController.deleteService);
router.get("/my", auth, serviceController.getFreelancerServices);

// Public routes
router.get("/browse", serviceController.browseServices);
router.get("/:id", serviceController.getServiceById);

module.exports = router;
