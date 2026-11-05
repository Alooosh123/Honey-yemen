"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const store_1 = require("../db/store");
const router = (0, express_1.Router)();
// List users for demo quick-switch
router.get('/users', (req, res) => {
    res.json({ users: store_1.dbStore.getUsers() });
});
// Login
router.post('/login', (req, res) => {
    const { email, role } = req.body;
    const users = store_1.dbStore.getUsers();
    let user = users.find((u) => u.email === email);
    if (!user && role) {
        user = users.find((u) => u.role === role);
    }
    if (!user) {
        user = users[0]; // fallback to admin
    }
    res.json({
        success: true,
        user,
        token: `demo-jwt-token-${user.id}`,
    });
});
exports.default = router;
