const cloudinary = require('cloudinary').v2;

const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || '').replace(/['"\s]/g, '');
const api_key = (process.env.CLOUDINARY_API_KEY || '').replace(/['"\s]/g, '');
const api_secret = (process.env.CLOUDINARY_API_SECRET || '').replace(/['"\s]/g, '');

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
  secure: true
});

module.exports = cloudinary;
