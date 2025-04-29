const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./models");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// const serviceRoutes = require('./routes/serviceRoutes');
const authRoutes = require('./routes/auth');




app.use("/api/auth", authRoutes);
// app.use('/api/services', serviceRoutes);

const PORT = process.env.PORT || 5000;

db.sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
