const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./models");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const serviceRoutes = require('./routes/service');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/order');

app.use("/api/auth", authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 5000;

db.sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
