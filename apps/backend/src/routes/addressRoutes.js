const express = require("express");

const router = express.Router();

const {
    getAddresses,
    createAddress
} = require("../controllers/addressController");

router.get(
    "/:customerId",
    getAddresses
);

router.post(
    "/create",
    createAddress
);

module.exports = router;