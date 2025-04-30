const { Service } = require("../models");
const cloudinary = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

exports.createService = async (req, res) => {
  try {
    const { title, description, price } = req.body;
    const freelancerId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'skillhire/services',
      resource_type: 'auto'
    });

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    const service = await Service.create({
      title,
      description,
      price,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
      freelancerId,
    });

    res.status(201).json(service);
  } catch (err) {
    // Clean up the temporary file if it exists
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const freelancerId = req.user.id;

    const service = await Service.findOne({ where: { id, freelancerId } });
    if (!service) return res.status(404).json({ message: "Service not found" });

    const { title, description, price } = req.body;
    const updateData = { title, description, price };

    // If a new image is uploaded
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (service.imagePublicId) {
        await cloudinary.uploader.destroy(service.imagePublicId);
      }

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'skillhire/services',
        resource_type: 'auto'
      });

      updateData.imageUrl = result.secure_url;
      updateData.imagePublicId = result.public_id;
    }

    await service.update(updateData);
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const freelancerId = req.user.id;

    const service = await Service.findOne({ where: { id, freelancerId } });
    if (!service) return res.status(404).json({ message: "Service not found" });

    // Delete image from Cloudinary if exists
    if (service.imagePublicId) {
      await cloudinary.uploader.destroy(service.imagePublicId);
    }

    await service.destroy();
    res.json({ message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFreelancerServices = async (req, res) => {
  try {
    const freelancerId = req.user.id;
    const services = await Service.findAll({ where: { freelancerId } });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getServiceById = async (req, res) => {
  try {
   const { id } = req.params;
   const service = await Service.findByPk(id);
   if (!service) return res.status(404).json({ message: "Service not found" });
   res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


