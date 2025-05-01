const Razorpay = require("razorpay");
const crypto = require("crypto");
const db = require("../models");
const { Order, OrderItem, Payment, Service, User } = db;

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

    
    let totalAmount = 0;
    const serviceIds = items.map(item => item.serviceId);
    
    const services = await Service.findAll({
      where: { id: serviceIds }
    });

    if (services.length !== serviceIds.length) {
      return res.status(400).json({ error: "One or more services not found" });
    }

 
    const order = await Order.create({
      userId: req.user.id,
      totalAmount: 0, 
      status: "pending"
    });

   
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

   
    await order.update({ totalAmount });

    
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: order.id,
    });

  
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

   
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      
      await order.update({ status: "failed" });
      return res.status(400).json({ error: "Invalid signature" });
    }

  
    await Payment.create({
      orderId: order.id,
      razorpayPaymentId,
      razorpaySignature,
      amount: order.totalAmount,
      status: "success",
    });

 
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

    if (order.status !== "pending") {
      return res.status(400).json({ error: "Only pending orders can be retried" });
    }

   
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), 
      currency: "INR",
      receipt: order.id,
    });

  
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

exports.getReceivedOrders = async (req, res) => {
  try {
  
    const services = await Service.findAll({
      where: { freelancerId: req.user.id }
    });

    if (!services.length) {
      return res.status(200).json([]);
    }

    const serviceIds = services.map(service => service.id);

   
    const orderItems = await OrderItem.findAll({
      where: { serviceId: serviceIds },
      include: [
        {
          model: Order,
          as: "order",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email"]
            }
          ]
        },
        {
          model: Service,
          as: "service",
          attributes: ["id", "title", "price", "imagePublicId"]
        }
      ]
    });

   
    const transformedOrders = orderItems.map(item => {
      return {
        id: item.order.id,
        serviceId: item.service.id,
        serviceName: item.service.title,
        servicePrice: item.price,
        clientId: item.order.user.id,
        clientName: item.order.user.name,
        status: item.order.status,
        createdAt: item.order.createdAt,
        updatedAt: item.order.updatedAt
      };
    });

    return res.status(200).json(transformedOrders);
  } catch (error) {
    console.error("Error fetching received orders:", error);
    return res.status(500).json({ error: "Failed to fetch received orders" });
  }
};

exports.completeOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    
 
    const services = await Service.findAll({
      where: { freelancerId: req.user.id }
    });
    
    if (!services.length) {
      return res.status(403).json({ error: "You don't have any services" });
    }
    
    const serviceIds = services.map(service => service.id);
    
    const orderItem = await OrderItem.findOne({
      where: { 
        orderId,
        serviceId: serviceIds
      },
      include: [{
        model: Order,
        as: "order"
      }]
    });
    
    if (!orderItem) {
      return res.status(404).json({ error: "Order not found or you don't have permission" });
    }
    
    const order = orderItem.order;
    
    if (order.status !== "paid") {
      return res.status(400).json({ error: "Only paid orders can be marked as completed" });
    }
    
 
    await order.update({ status: "completed" });
    
    return res.status(200).json({ 
      success: true,
      message: "Order marked as completed successfully"
    });
  } catch (error) {
    console.error("Error completing order:", error);
    return res.status(500).json({ error: "Failed to complete order" });
  }
}; 