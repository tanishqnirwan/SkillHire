const { Sequelize, DataTypes } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();


const sequelize = new Sequelize(process.env.SUPABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false 
    }
  },
  logging: false
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;


db.User = require("./user")(sequelize, DataTypes);
db.Service = require("./service")(sequelize, DataTypes);
db.Order = require("./order")(sequelize, DataTypes);
db.OrderItem = require("./orderItem")(sequelize, DataTypes);
db.Payment = require("./payment")(sequelize, DataTypes);


db.User.hasMany(db.Service, { foreignKey: "freelancerId", as: "services" });
db.Service.belongsTo(db.User, { foreignKey: "freelancerId", as: "freelancer" });

// Order associations
db.User.hasMany(db.Order, { foreignKey: "userId", as: "orders" });
db.Order.belongsTo(db.User, { foreignKey: "userId", as: "user" });

// OrderItem associations
db.Order.hasMany(db.OrderItem, { foreignKey: "orderId", as: "items" });
db.OrderItem.belongsTo(db.Order, { foreignKey: "orderId", as: "order" });
db.Service.hasMany(db.OrderItem, { foreignKey: "serviceId", as: "orderItems" });
db.OrderItem.belongsTo(db.Service, { foreignKey: "serviceId", as: "service" });

// Payment associations
db.Order.hasOne(db.Payment, { foreignKey: "orderId", as: "payment" });
db.Payment.belongsTo(db.Order, { foreignKey: "orderId", as: "order" });

module.exports = db;