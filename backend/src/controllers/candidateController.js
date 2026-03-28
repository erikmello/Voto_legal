const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { isCloudinaryEnabled, uploadCandidatePhoto, deleteAsset } = require('../services/cloudinary');

const normalizePhotoPath = (photo) => {
    if (!photo) return null;
    const p = String(photo).replace(/\\/g, '/');
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    if (p.startsWith('/uploads/')) return p;
    if (p.includes('/uploads/')) return p.slice(p.lastIndexOf('/uploads/'));
    if (p.includes('/src/uploads/')) return `/uploads/${p.split('/src/uploads/').pop()}`;
    if (p.includes('uploads/')) return `/uploads/${p.split('uploads/').pop()}`;
    if (p.startsWith('uploads/')) return `/${p}`;
    if (!p.includes('/')) return `/uploads/${p}`;
    return p;
};

exports.createCandidate = async(req, res) => {
    try {
        const { name, number, party, description, electionId } = req.body;
        let photo = null;
        let photoPublicId = null;
        if (req.file) {
            if (isCloudinaryEnabled() && req.file.buffer) {
                const uploaded = await uploadCandidatePhoto(req.file.buffer, { folder: `voto-legal/elections/${electionId}` });
                photo = uploaded.secure_url || uploaded.url || null;
                photoPublicId = uploaded.public_id || null;
            } else if (req.file.filename) {
                photo = `/uploads/${req.file.filename}`;
            }
        }

        const candidate = await prisma.candidate.create({
            data: {
                name,
                number,
                party,
                description,
                electionId,
                photo: normalizePhotoPath(photo),
                photoPublicId,
            }
        });
        res.status(201).json(candidate);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCandidatesByElection = async(req, res) => {
    try {
        const { electionId } = req.params;
        const candidates = await prisma.candidate.findMany({
            where: { electionId }
        });
        res.json(candidates.map((c) => ({...c, photo: normalizePhotoPath(c.photo) })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteCandidate = async(req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.candidate.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Candidato não encontrado' });
        await prisma.candidate.delete({ where: { id } });
        if (isCloudinaryEnabled() && existing.photoPublicId) {
            try {
                await deleteAsset(existing.photoPublicId);
            } catch (_) {
            }
        }
        res.json({ message: 'Candidato excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
