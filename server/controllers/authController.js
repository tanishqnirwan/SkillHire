const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../models");
const User = db.User;

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return res.status(201).json({ msg: "User registered" });
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.verify = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ msg: "User not found" });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.createDemoAccount = async (req, res) => {
  try {
    const randomId = crypto.randomUUID().split('-')[0];
    
    // Generate unique email
    const email = `demo-${randomId}@skillhire.demo`;
    
    // Check if email already exists (unlikely but possible)
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      // If exists, generate new one
      const newRandomId = crypto.randomUUID().split('-')[0];
      const newEmail = `demo-${newRandomId}@skillhire.demo`;
      return await createDemoUser(newEmail, res);
    }
    
    await createDemoUser(email, res);
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

async function createDemoUser(email, res) {
  const randomId = crypto.randomUUID().split('-')[0];
  
  // Generate random name
  const name = `Demo User ${randomId}`;
  
  // Generate random password
  const password = crypto.randomUUID();
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create demo user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'client',
    isDemo: true,
  });
  
  // Generate token
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  
  return res.json({ 
    token, 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    } 
  });
}
