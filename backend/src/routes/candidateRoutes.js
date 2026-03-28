const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isCloudinaryEnabled } = require('../services/cloudinary');

const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads');
        try {
            fs.mkdirSync(dir, { recursive: true });
        } catch (_) {}
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const original = String(file.originalname || 'file');
        const safeOriginal = original
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, Date.now() + '-' + safeOriginal);
    }
});

const storage = isCloudinaryEnabled() ? multer.memoryStorage() : diskStorage;

const upload = multer({
    storage,
    limits: { fileSize: 6 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file || !file.mimetype) return cb(null, false);
        if (file.mimetype.startsWith('image/')) return cb(null, true);
        cb(new Error('Arquivo inválido. Envie uma imagem.'));
    }
});

router.post('/', upload.single('photo'), candidateController.createCandidate);
router.get('/election/:electionId', candidateController.getCandidatesByElection);
router.delete('/:id', candidateController.deleteCandidate);

module.exports = router;
