module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define("Service", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    imagePublicId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Foreign key to User (Freelancer)
    freelancerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });

  Service.associate = (models) => {
    Service.belongsTo(models.User, { foreignKey: "freelancerId", as: "freelancer" });
  };

  return Service;
};
