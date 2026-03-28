const cloudinary = require('cloudinary').v2;

const isCloudinaryEnabled = () => {
  if (process.env.CLOUDINARY_URL) return true;
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) return true;
  return false;
};

const configureCloudinary = () => {
  if (!isCloudinaryEnabled()) return;
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
    return;
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

const uploadCandidatePhoto = (buffer, opts = {}) => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: opts.folder || 'voto-legal/candidates',
        resource_type: 'image',
        overwrite: false,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const deleteAsset = async (publicId) => {
  if (!publicId) return null;
  configureCloudinary();
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};

module.exports = {
  isCloudinaryEnabled,
  uploadCandidatePhoto,
  deleteAsset,
};

