const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/auth");

// Protected routes - require authentication
router.post("/", auth, orderController.createOrder);
router.post("/verify", auth, orderController.verifyPayment);
router.get("/", auth, orderController.getOrders);
router.get("/:id", auth, orderController.getOrderById);
router.post("/:id/cancel", auth, orderController.cancelOrder);
router.post("/:id/retry", auth, orderController.retryPayment);

module.exports = router; 