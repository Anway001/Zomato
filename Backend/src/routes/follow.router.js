const express = require('express');
const followController = require('../controllers/followcontroller');
const authmiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/:partnerId', authmiddleware.usermiddleware, followController.followPartner);

module.exports = router;