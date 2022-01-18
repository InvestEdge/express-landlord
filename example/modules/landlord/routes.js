/**
 * This module exists purely to test our route loader.
 */

const router = require('express').Router();

/*
    List the tenant config for the current tenant
*/
router.get('/', async (req, res) => {
    res.send(req.tenant);
});

module.exports = router;
