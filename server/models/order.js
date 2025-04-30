module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "paid", "failed", "canceled"),
      defaultValue: "pending",
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    razorpayOrderId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
  });

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Order.hasMany(models.OrderItem, { foreignKey: "orderId", as: "items" });
    Order.hasOne(models.Payment, { foreignKey: "orderId", as: "payment" });
  };

  return Order;
}; 