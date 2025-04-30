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


db.User.hasMany(db.Service, { foreignKey: "freelancerId", as: "services" });
db.Service.belongsTo(db.User, { foreignKey: "freelancerId", as: "freelancer" });

module.exports = {
  sequelize,
  User: db.User,
  Service: db.Service,
 
};