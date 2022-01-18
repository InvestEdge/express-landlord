/**
 * This module exists purely to test our route loader.
 */

const router = require('express').Router();


router.get(
    '/test1',
    (req, res) => {
        res.send(`${req.path} - Test route 1.`);
    }
);

router.get(
    '/test2',
    (req, res) => {
        res.send(`${req.path} - GET: Test route 2.`);
    }
);

router.post(
    '/test2',
    (req, res) => {
        res.send(`${req.path} - POST: Test route 2.`);
    }
);

module.exports = router;
