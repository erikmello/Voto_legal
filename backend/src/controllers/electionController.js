const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const xlsx = require('xlsx');
const path = require('path');

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

exports.createElection = async(req, res) => {
    try {
        const { name, startDate, endDate, type, candidateCount } = req.body;
        const election = await prisma.election.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                type,
                candidateCount: parseInt(candidateCount),
            }
        });
        res.status(201).json(election);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllElections = async(req, res) => {
    try {
        const elections = await prisma.election.findMany({
            include: {
                candidates: true,
                voters: true,
            }
        });
        res.json(elections.map((e) => ({
            ...e,
            candidates: (e.candidates || []).map((c) => ({ ...c, photo: normalizePhotoPath(c.photo) }))
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getElectionById = async(req, res) => {
    try {
        const { id } = req.params;
        const election = await prisma.election.findUnique({
            where: { id },
            include: {
                candidates: true,
                voters: true,
            }
        });
        if (!election) return res.status(404).json({ error: 'Election not found' });
        res.json({
            ...election,
            candidates: (election.candidates || []).map((c) => ({ ...c, photo: normalizePhotoPath(c.photo) }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getElectionResults = async(req, res) => {
    try {
        const { id } = req.params;
        const election = await prisma.election.findUnique({
            where: { id },
            include: {
                candidates: true,
                votes: true,
            }
        });

        if (!election) return res.status(404).json({ error: 'Election not found' });

        const results = election.candidates.map(candidate => {
            const voteCount = election.votes.filter(v => v.candidateNumber === candidate.number).length;
            return {
                ...candidate,
                photo: normalizePhotoPath(candidate.photo),
                voteCount
            };
        });

        const blankVotes = election.votes.filter(v => v.candidateNumber === 'BRANCO').length;
        const nullVotes = election.votes.filter(v => v.candidateNumber === 'NULO').length;
        const totalVotes = election.votes.length;

        res.json({
            electionName: election.name,
            results,
            blankVotes,
            nullVotes,
            totalVotes
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getZeresima = async(req, res) => {
    try {
        const { id } = req.params;
        const election = await prisma.election.findUnique({
            where: { id },
            include: {
                candidates: true,
                votes: true,
            }
        });

        if (!election) return res.status(404).json({ error: 'Election not found' });

        const zeresima = {
            electionName: election.name,
            timestamp: new Date(),
            candidates: election.candidates.map(c => ({
                name: c.name,
                number: c.number,
                votes: 0
            })),
            confirmedZero: election.votes.length === 0
        };

        res.json(zeresima);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.exportResults = async(req, res) => {
    try {
        const { id } = req.params;
        const election = await prisma.election.findUnique({
            where: { id },
            include: {
                candidates: true,
                votes: true,
            }
        });

        if (!election) return res.status(404).json({ error: 'Election not found' });

        const resultsData = election.candidates.map(candidate => ({
            'Candidato': candidate.name,
            'Número': candidate.number,
            'Partido': candidate.party,
            'Votos': election.votes.filter(v => v.candidateNumber === candidate.number).length
        }));

        resultsData.push({ 'Candidato': 'Brancos', 'Votos': election.votes.filter(v => v.candidateNumber === 'BRANCO').length });
        resultsData.push({ 'Candidato': 'Nulos', 'Votos': election.votes.filter(v => v.candidateNumber === 'NULO').length });
        resultsData.push({ 'Candidato': 'TOTAL GERAL', 'Votos': election.votes.length });

        const ws = xlsx.utils.json_to_sheet(resultsData);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Resultados");

        const filePath = path.join(__dirname, '..', 'uploads', `resultado_${id}.xlsx`);
        xlsx.writeFile(wb, filePath);

        res.download(filePath);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteElection = async(req, res) => {
    try {
        const { id } = req.params;

        await prisma.vote.deleteMany({ where: { electionId: id } });
        await prisma.voter.deleteMany({ where: { electionId: id } });
        await prisma.candidate.deleteMany({ where: { electionId: id } });

        await prisma.election.delete({
            where: { id }
        });

        res.json({ message: 'Eleição excluída com sucesso' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
};
