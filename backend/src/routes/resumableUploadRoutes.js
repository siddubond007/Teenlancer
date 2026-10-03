const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middlewares/authMiddleware');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

const resumableRoot = path.join(__dirname, '../../uploads_temp/resumable');
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const CHUNK_SIZE = 5 * 1024 * 1024;

if (!fs.existsSync(resumableRoot)) {
  fs.mkdirSync(resumableRoot, { recursive: true });
}

const getUserRoot = (userId) => {
  const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const dir = path.join(resumableRoot, safeUserId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const uploadDir = (userId, uploadId) => {
  const dir = path.join(getUserRoot(userId), uploadId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

router.post('/init', requireAuth, (req, res) => {
  try {
    const {
      fileName,
      fileSize,
      contentType,
      totalChunks
    } = req.body || {};

    if (!fileName || !Number.isInteger(Number(fileSize))) {
      return res.status(400).json({ error: 'fileName and fileSize are required.' });
    }

    const size = Number(fileSize);

    if (size <= 0 || size > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File size must be greater than 0 and at most 500 MB.' });
    }

    const expectedChunks = Math.ceil(size / CHUNK_SIZE);

    if (Number(totalChunks) !== expectedChunks) {
      return res.status(400).json({
        error: `Invalid totalChunks. Expected ${expectedChunks}.`
      });
    }

    const uploadId = crypto.randomUUID();
    const dir = uploadDir(req.user.id, uploadId);

    fs.writeFileSync(
      path.join(dir, 'metadata.json'),
      JSON.stringify({
        uploadId,
        userId: req.user.id,
        fileName: path.basename(fileName),
        fileSize: size,
        contentType: contentType || 'application/octet-stream',
        totalChunks: expectedChunks,
        chunkSize: CHUNK_SIZE,
        createdAt: new Date().toISOString()
      }, null, 2)
    );

    return res.status(201).json({
      uploadId,
      chunkSize: CHUNK_SIZE,
      totalChunks: expectedChunks
    });
  } catch (err) {
    console.error('Resumable upload init error:', err);
    return res.status(500).json({ error: 'Failed to initialize resumable upload.' });
  }
});


router.post('/:uploadId/chunk', requireAuth, (req, res) => {
  try {
    const uploadId = String(req.params.uploadId || '').trim();
    const chunkIndex = Number(req.headers['x-chunk-index']);
    const totalChunks = Number(req.headers['x-total-chunks']);
    const rawContentLength = req.headers['content-length'];

    if (!uploadId) {
      return res.status(400).json({ error: 'uploadId is required.' });
    }

    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
      return res.status(400).json({ error: 'Valid x-chunk-index header is required.' });
    }

    if (!Number.isInteger(totalChunks) || totalChunks <= 0) {
      return res.status(400).json({ error: 'Valid x-total-chunks header is required.' });
    }

    const dir = path.join(getUserRoot(req.user.id), uploadId);
    const metadataPath = path.join(dir, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: 'Upload session not found.' });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    if (metadata.totalChunks !== totalChunks) {
      return res.status(400).json({ error: 'Chunk count does not match upload session.' });
    }

    if (chunkIndex >= metadata.totalChunks) {
      return res.status(400).json({ error: 'Chunk index is out of range.' });
    }

    const contentLength = Number(rawContentLength);

    if (!Number.isInteger(contentLength) || contentLength <= 0) {
      return res.status(400).json({ error: 'A valid Content-Length header is required.' });
    }

    const expectedSize =
      chunkIndex === metadata.totalChunks - 1
        ? metadata.fileSize - (metadata.chunkSize * chunkIndex)
        : metadata.chunkSize;

    if (contentLength !== expectedSize) {
      return res.status(400).json({
        error: `Invalid chunk size. Expected ${expectedSize} bytes.`
      });
    }

    const chunkPath = path.join(dir, `chunk-${chunkIndex}`);
    const tempChunkPath = `${chunkPath}.tmp`;

    if (fs.existsSync(chunkPath)) {
      const existingSize = fs.statSync(chunkPath).size;

      if (existingSize === expectedSize) {
        return res.json({
          uploadId,
          chunkIndex,
          received: true,
          alreadyUploaded: true
        });
      }

      fs.unlinkSync(chunkPath);
    }

    const output = fs.createWriteStream(tempChunkPath, { flags: 'wx' });

    let receivedBytes = 0;

    req.on('data', (chunk) => {
      receivedBytes += chunk.length;
    });

    req.on('aborted', () => {
      output.destroy();
      try {
        if (fs.existsSync(tempChunkPath)) fs.unlinkSync(tempChunkPath);
      } catch {}
    });

    req.on('error', (err) => {
      output.destroy(err);
    });

    output.on('error', (err) => {
      try {
        if (fs.existsSync(tempChunkPath)) fs.unlinkSync(tempChunkPath);
      } catch {}

      if (!res.headersSent) {
        console.error('Chunk write error:', err);
        res.status(500).json({ error: 'Failed to write upload chunk.' });
      }
    });

    output.on('finish', () => {
      try {
        const actualSize = fs.statSync(tempChunkPath).size;

        if (actualSize !== expectedSize || receivedBytes !== expectedSize) {
          fs.unlinkSync(tempChunkPath);
          return res.status(400).json({
            error: `Received chunk size mismatch. Expected ${expectedSize} bytes, got ${actualSize}.`
          });
        }

        fs.renameSync(tempChunkPath, chunkPath);

        return res.json({
          uploadId,
          chunkIndex,
          received: true,
          alreadyUploaded: false
        });
      } catch (err) {
        try {
          if (fs.existsSync(tempChunkPath)) fs.unlinkSync(tempChunkPath);
        } catch {}

        console.error('Chunk finalize error:', err);
        return res.status(500).json({ error: 'Failed to finalize upload chunk.' });
      }
    });

    req.pipe(output);
  } catch (err) {
    console.error('Resumable upload chunk error:', err);
    return res.status(500).json({ error: 'Failed to receive upload chunk.' });
  }
});

router.get('/:uploadId/status', requireAuth, (req, res) => {
  try {
    const dir = path.join(getUserRoot(req.user.id), req.params.uploadId);
    const metadataPath = path.join(dir, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: 'Upload session not found.' });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const uploadedChunks = [];

    for (let index = 0; index < metadata.totalChunks; index += 1) {
      const chunkPath = path.join(dir, `chunk-${index}`);
      if (fs.existsSync(chunkPath)) {
        uploadedChunks.push(index);
      }
    }

    return res.json({
      uploadId: metadata.uploadId,
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      totalChunks: metadata.totalChunks,
      chunkSize: metadata.chunkSize,
      uploadedChunks
    });
  } catch (err) {
    console.error('Resumable upload status error:', err);
    return res.status(500).json({ error: 'Failed to read upload status.' });
  }
});


router.post('/:uploadId/complete', requireAuth, async (req, res) => {
  try {
    const uploadId = String(req.params.uploadId || '').trim();

    if (!uploadId) {
      return res.status(400).json({ error: 'uploadId is required.' });
    }

    const dir = path.join(getUserRoot(req.user.id), uploadId);
    const metadataPath = path.join(dir, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: 'Upload session not found.' });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    const missingChunks = [];

    for (let index = 0; index < metadata.totalChunks; index += 1) {
      const chunkPath = path.join(dir, `chunk-${index}`);

      if (!fs.existsSync(chunkPath)) {
        missingChunks.push(index);
        continue;
      }

      const expectedSize =
        index === metadata.totalChunks - 1
          ? metadata.fileSize - (metadata.chunkSize * index)
          : metadata.chunkSize;

      const actualSize = fs.statSync(chunkPath).size;

      if (actualSize !== expectedSize) {
        return res.status(400).json({
          error: `Chunk ${index} has invalid size.`,
          expectedSize,
          actualSize
        });
      }
    }

    if (missingChunks.length > 0) {
      return res.status(409).json({
        error: 'Upload is incomplete.',
        missingChunks
      });
    }

    
const mergedFilePath = path.join(
  dir,
  `merged-${Date.now()}-${metadata.fileName}`
);

const mergedWriteStream = fs.createWriteStream(mergedFilePath);

for (let index = 0; index < metadata.totalChunks; index += 1) {
  const chunkPath = path.join(dir, `chunk-${index}`);

  await new Promise((resolve, reject) => {
    const chunkStream = fs.createReadStream(chunkPath);

    chunkStream.on('error', reject);
    chunkStream.on('end', resolve);

    chunkStream.pipe(mergedWriteStream, { end: false });
  });
}

await new Promise((resolve, reject) => {
  mergedWriteStream.end();
  mergedWriteStream.on('finish', resolve);
  mergedWriteStream.on('error', reject);
});

const userFolderSlug = (
  req.user?.username ||
  req.user?.email?.split('@')[0] ||
  req.user?.id ||
  'general_user'
).replace(/[^a-zA-Z0-9_-]/g, '_');

const userCloudinaryFolder = `skilllaunch_users/${userFolderSlug}`;

const publicIdBase = path
  .basename(metadata.fileName)
  .replace(/\.[^/.]+$/, '')
  .replace(/[^a-zA-Z0-9_-]/g, '_');

const uploadRes = await cloudinary.uploader.upload(
  mergedFilePath,
  {
    folder: userCloudinaryFolder,
    public_id: `${publicIdBase}-${uploadId}`,
    resource_type: 'auto'
  }
);

try {
  if (fs.existsSync(mergedFilePath)) {
    fs.unlinkSync(mergedFilePath);
  }
} catch {}


    for (let index = 0; index < metadata.totalChunks; index += 1) {
      const chunkPath = path.join(dir, `chunk-${index}`);
      try {
        if (fs.existsSync(chunkPath)) {
          fs.unlinkSync(chunkPath);
        }
      } catch (cleanupErr) {
        console.warn(`Chunk cleanup warning (${index}):`, cleanupErr.message);
      }
    }

    try {
      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
      }

      if (fs.existsSync(dir)) {
        fs.rmdirSync(dir);
      }
    } catch (cleanupErr) {
      console.warn('Upload session cleanup warning:', cleanupErr.message);
    }

    return res.json({
      success: true,
      uploadId,
      url: uploadRes.secure_url,
      secure_url: uploadRes.secure_url,
      publicId: uploadRes.public_id,
      resourceType: uploadRes.resource_type,
      bytes: uploadRes.bytes,
      format: uploadRes.format
    });
  } catch (err) {
    console.error('Resumable upload completion error:', err);
    return res.status(500).json({
      error: 'Failed to complete resumable upload.',
      details: err?.message || 'Unknown upload error'
    });
  }
});

module.exports = router;
