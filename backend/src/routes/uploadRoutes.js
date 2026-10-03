const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const cloudinary = require('../config/cloudinary');
const prisma = require('../config/db');
const { requireAuth } = require('../middlewares/authMiddleware');

const cloudinaryAgent = new https.Agent({ family: 4 });

// Temporary disk storage before streaming to Cloudinary
const tempDir = path.join(__dirname, '../../uploads_temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const cleanExt = path.extname(file.originalname) || '.png';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${cleanExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

const resumeUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]);
    const extension = path.extname(file.originalname || '').toLowerCase();
    const allowedExtensions = new Set(['.pdf', '.doc', '.docx']);

    const mimeAllowed =
      allowedMimeTypes.has(file.mimetype) ||
      file.mimetype === 'application/octet-stream';

    if (mimeAllowed && allowedExtensions.has(extension)) {
      return cb(null, true);
    }

    return cb(new Error('Only PDF, DOC, or DOCX resume files are supported.'));
  }
});

// Resume Upload Endpoint
// Stores the uploaded resume in Cloudinary and links it to the authenticated profile.
router.post('/resume', requireAuth, (req, res, next) => {
  resumeUpload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        error: err.message || 'Resume upload failed.'
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Please choose a PDF, DOC, or DOCX resume file.'
        });
      }

      const userFolderSlug = (req.user?.username || req.user?.email?.split('@')[0] || req.user?.id || 'general_user')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const userCloudinaryFolder = `skilllaunch_users/${userFolderSlug}/resume`;

      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: userCloudinaryFolder,
        resource_type: 'raw',
        type: 'upload',
        use_filename: true,
        unique_filename: true,
        agent: cloudinaryAgent
      });

      await prisma.profile.update({
        where: { userId: req.user.id },
        data: {
          resumeUrl: uploadRes.secure_url,
          resumeFileName: req.file.originalname
        }
      });

      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupErr) {
        console.warn('Resume temp cleanup warning:', cleanupErr);
      }

      return res.status(201).json({
        message: 'Resume uploaded successfully.',
        url: uploadRes.secure_url,
        fileName: req.file.originalname,
        bytes: uploadRes.bytes
      });
    } catch (uploadError) {
      console.error('Resume upload error:', uploadError);
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(500).json({
        error: 'Unable to upload your resume right now. Please try again.'
      });
    }
  });
});

// Upload Endpoint: Automatically organizes uploads into user-specific Cloudinary folders
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    // 1. Create a clean, dedicated folder slug for this user
    const userFolderSlug = (req.user?.username || req.user?.email?.split('@')[0] || req.user?.id || 'general_user')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Dedicated Cloudinary folder path (e.g. "skilllaunch_users/a_a")
    const userCloudinaryFolder = `skilllaunch_users/${userFolderSlug}`;
    console.log(`📁 Streaming upload for ${req.user?.email} -> Cloudinary folder: [${userCloudinaryFolder}]`);

    // 2. If base64 data was sent in JSON body (e.g. Cropped avatars or cover banners)
    if (req.body && req.body.base64Data) {
      const uploadRes = await cloudinary.uploader.upload(req.body.base64Data, {
        folder: userCloudinaryFolder,
        resource_type: 'auto',
        agent: cloudinaryAgent
      });
      console.log(`✅ Saved to Cloudinary: ${uploadRes.secure_url}`);
      return res.json({
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
        resourceType: uploadRes.resource_type,
        format: uploadRes.format,
        bytes: uploadRes.bytes
      });
    }

    // 3. If file was sent via Multipart Form (e.g. Student ID Card / Govt ID / Portfolio)
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided for upload.' });
    }

    const uploadRes = await cloudinary.uploader.upload(req.file.path, {
      folder: userCloudinaryFolder,
      resource_type: 'auto',
      agent: cloudinaryAgent
    });

    // Clean up temporary local disk file immediately after Cloudinary upload
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupErr) {
      console.warn('Temp file cleanup warning:', cleanupErr);
    }

    console.log(`✅ Saved to Cloudinary: ${uploadRes.secure_url}`);
    return res.json({
      url: uploadRes.secure_url,
      publicId: uploadRes.public_id,
      resourceType: uploadRes.resource_type,
      format: uploadRes.format,
      bytes: uploadRes.bytes
    });
  } catch (err) {
    console.error('Cloudinary Upload Error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    const errorMessage = err?.message || err?.error?.message || JSON.stringify(err);
    res.status(500).json({ error: 'Cloudinary upload failed: ' + errorMessage });
  }
});

module.exports = router;
