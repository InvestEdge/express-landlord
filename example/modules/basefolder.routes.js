/**
 * This module exists purely to test our route loader.
 */

const router = require('express').Router();

router.get('/basefolder', (req, res) => {
    res.send(`${req.path}`);
});

module.exports = router;
