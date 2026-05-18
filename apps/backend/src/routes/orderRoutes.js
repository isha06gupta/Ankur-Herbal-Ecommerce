const express = require("express");

const router = express.Router();

const {
    createOrder,
    getAllOrders,
    updateOrderStatus,
    updateCourier,
    generateShipmentId,
    getCourierOrders
} = require("../controllers/orderController");

// GET ALL ORDERS
router.get("/", getAllOrders);

// CREATE ORDER
router.post("/", createOrder);

// UPDATE STATUS
router.put("/:orderId/status", updateOrderStatus);

// UPDATE COURIER
router.put("/:orderId/courier", updateCourier);

// GENERATE SHIPMENT ID
router.put("/:orderId/shipment", generateShipmentId);

router.get(
    "/courier/:email",
    getCourierOrders
);

module.exports = router;