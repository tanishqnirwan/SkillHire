const { Service, User } = require("../models");
const cloudinary = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');


exports.browseServices = async (req, res) => {
  try {
    const services = await Service.findAll({
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

exports.createService = async (req, res) => {
  try {
    const { title, description, price } = req.body;
    const freelancerId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

   
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'skillhire/services',
      resource_type: 'auto'
    });

    
    fs.unlinkSync(req.file.path);

    const service = await Service.create({
      title,
      description,
      price,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
      freelancerId,
    });

    
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


    if (req.file) {
    
      if (service.imagePublicId) {
        await cloudinary.uploader.destroy(service.imagePublicId);
      }

      
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'skillhire/services',
        resource_type: 'auto'
      });

     
      fs.unlinkSync(req.file.path);

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




