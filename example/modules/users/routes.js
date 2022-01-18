/**
 * This module exists purely to test our route loader.
 */

const router = require('express').Router();

/*
    List some users from our tenant db
*/
router.get(
    '/',
    async (req, res, next) => {
        try {
            const users = await req.tenant.db.getUsers();
            res.send(users);
        } catch (error) {
            next(error);
        }
    }
);

router.get('/profile', async (req, res) => {
    res.send(`${req.path}`);
});

module.exports = router;
