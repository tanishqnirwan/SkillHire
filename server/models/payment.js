module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define("Payment", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    razorpayPaymentId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    razorpaySignature: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "success", "failed"),
      defaultValue: "pending",
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Order, { foreignKey: "orderId", as: "order" });
  };

  return Payment;
}; 