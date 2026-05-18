const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser,
    getAllCouriers
} = require("../controllers/userController");

// REGISTER
router.post(
    "/register",
    registerUser
);

// LOGIN
router.post(
    "/login",
    loginUser
);

// GET ALL COURIERS
router.get(
    "/couriers",
    getAllCouriers
);

module.exports = router;