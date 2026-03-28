const express = require('express');
const router = express.Router();
const electionController = require('../controllers/electionController');

router.post('/', electionController.createElection);
router.get('/', electionController.getAllElections);
router.get('/:id', electionController.getElectionById);
router.get('/:id/results', electionController.getElectionResults);
router.get('/:id/zeresima', electionController.getZeresima);
router.get('/:id/export', electionController.exportResults);
router.delete('/:id', electionController.deleteElection);

module.exports = router;