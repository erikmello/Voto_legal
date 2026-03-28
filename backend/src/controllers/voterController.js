const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createVoter = async(req, res) => {
    try {
        const { name, identifier, electionId } = req.body;
        const voter = await prisma.voter.create({
            data: {
                name,
                identifier,
                electionId,
            }
        });
        res.status(201).json(voter);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getVoterByIdentifier = async(req, res) => {
    try {
        const { identifier } = req.params;
        const { electionId } = req.query;

        if (electionId) {
            const voter = await prisma.voter.findUnique({
                where: {
                    electionId_identifier: {
                        electionId: String(electionId),
                        identifier: String(identifier)
                    }
                },
                include: {
                    election: true,
                }
            });
            if (!voter) return res.status(404).json({ error: 'Voter not found' });
            return res.json(voter);
        }

        const matches = await prisma.voter.findMany({
            where: { identifier: String(identifier) },
            include: { election: true },
            take: 2
        });

        if (matches.length === 0) return res.status(404).json({ error: 'Voter not found' });
        if (matches.length > 1) return res.status(400).json({ error: 'Identificador existe em múltiplas eleições. Informe electionId.' });
        res.json(matches[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.vote = async(req, res) => {
    try {
        const { identifier, electionId, candidateNumber } = req.body;

        const voter = await prisma.voter.findUnique({
            where: {
                electionId_identifier: {
                    electionId: String(electionId),
                    identifier: String(identifier)
                }
            }
        });

        if (!voter) return res.status(404).json({ error: 'Eleitor não encontrado para esta eleição' });
        if (voter.hasVoted) return res.status(400).json({ error: 'Eleitor já votou' });

        await prisma.$transaction([
            prisma.voter.update({
                where: { id: voter.id },
                data: { hasVoted: true }
            }),
            prisma.vote.create({
                data: {
                    electionId,
                    candidateNumber,
                }
            })
        ]);

        res.json({ message: 'Voto registrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteVoter = async(req, res) => {
    try {
        const { id } = req.params;
        await prisma.voter.delete({
            where: { id }
        });
        res.json({ message: 'Eleitor excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
