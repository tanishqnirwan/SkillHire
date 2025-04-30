const { Service, User } = require("../models");
const cloudinary = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

// Get all services with freelancer info for browsing (public)
exports.browseServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      include: [
        {
          model: User,
          as: 'freelancer',
          attributes: ['id', 'name', 'email'] // Only include necessary fields
        }
      ]
    });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

    // Get the newly created service with freelancer info
    const serviceWithFreelancer = await Service.findByPk(service.id, {
      include: [
        {
          model: User,
          as: 'freelancer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(serviceWithFreelancer);
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
    
    // Get the updated service with freelancer info
    const updatedService = await Service.findByPk(id, {
      include: [
        {
          model: User,
          as: 'freelancer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    res.json(updatedService);
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
    const services = await Service.findAll({ 
      where: { freelancerId },
      include: [
        {
          model: User,
          as: 'freelancer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getServiceById = async (req, res) => {
  try {
   const { id } = req.params;
   const service = await Service.findByPk(id, {
     include: [
       {
         model: User,
         as: 'freelancer',
         attributes: ['id', 'name', 'email']
       }
     ]
   });
   if (!service) return res.status(404).json({ message: "Service not found" });
   res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




