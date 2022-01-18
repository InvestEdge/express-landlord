/**
 * This module exists purely to test our route loader.
 */

const router = require('express').Router();

router.get('/another-test', (req, res) => {
    res.send(`${req.path}`);
});

module.exports = router;
