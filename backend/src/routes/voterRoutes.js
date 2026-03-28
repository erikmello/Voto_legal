const express = require('express');
const router = express.Router();
const voterController = require('../controllers/voterController');

router.post('/', voterController.createVoter);
router.get('/:identifier', voterController.getVoterByIdentifier);
router.post('/vote', voterController.vote);
router.delete('/:id', voterController.deleteVoter);

module.exports = router;