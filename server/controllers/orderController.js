const Razorpay = require("razorpay");
const crypto = require("crypto");
const db = require("../models");
const { Order, OrderItem, Payment, Service } = db;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({ error: "No items provided" });
    }

    // Calculate total amount and validate items
    let totalAmount = 0;
    const serviceIds = items.map(item => item.serviceId);
    
    const services = await Service.findAll({
      where: { id: serviceIds }
    });

    if (services.length !== serviceIds.length) {
      return res.status(400).json({ error: "One or more services not found" });
    }

    // Create order in database
    const order = await Order.create({
      userId: req.user.id,
      totalAmount: 0, // Will update after calculation
      status: "pending"
    });

    // Create order items and calculate total
    const orderItems = [];
    for (const item of items) {
      const service = services.find(s => s.id === item.serviceId);
      const amount = service.price * (item.quantity || 1);
      totalAmount += amount;
      
      const orderItem = await OrderItem.create({
        orderId: order.id,
        serviceId: item.serviceId,
        quantity: item.quantity || 1,
        price: service.price
      });
      
      orderItems.push(orderItem);
    }

    // Update total amount
    await order.update({ totalAmount });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // Convert to paise
      currency: "INR",
      receipt: order.id,
    });

    // Update order with Razorpay order ID
    await order.update({ razorpayOrderId: razorpayOrder.id });

    return res.status(201).json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Failed to create order" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    const order = await Order.findOne({
      where: { id: orderId, razorpayOrderId },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      // Update order status to failed
      await order.update({ status: "failed" });
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Create payment record
    await Payment.create({
      orderId: order.id,
      razorpayPaymentId,
      razorpaySignature,
      amount: order.totalAmount,
      status: "success",
    });

    // Update order status
    await order.update({ status: "paid" });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ error: "Failed to verify payment" });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Service,
              as: "service",
              attributes: ["id", "title", "price", "imagePublicId"],
            },
          ],
        },
        {
          model: Payment,
          as: "payment",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Service,
              as: "service",
              attributes: ["id", "title", "price", "imagePublicId"],
            },
          ],
        },
        {
          model: Payment,
          as: "payment",
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "pending" && order.status !== "failed") {
      return res.status(400).json({ error: "Only pending or failed orders can be canceled" });
    }

    await order.update({ status: "canceled" });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error canceling order:", error);
    return res.status(500).json({ error: "Failed to cancel order" });
  }
};

exports.retryPayment = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "failed") {
      return res.status(400).json({ error: "Only failed orders can be retried" });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // Convert to paise
      currency: "INR",
      receipt: order.id,
    });

    // Update order with new Razorpay order ID
    await order.update({ 
      razorpayOrderId: razorpayOrder.id,
      status: "pending" 
    });

    return res.status(200).json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalAmount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error retrying payment:", error);
    return res.status(500).json({ error: "Failed to retry payment" });
  }
}; 