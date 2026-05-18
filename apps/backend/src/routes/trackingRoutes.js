const express = require("express");

const router = express.Router();

const { query } = require("../db/db");

router.get("/:orderId", async (req, res) => {

    try {

        const { orderId } = req.params;

        const result = await query(
            `
            SELECT *
            FROM shipment_tracking
            WHERE order_id = $1
            ORDER BY created_at DESC
            `,
            [orderId]
        );

        res.json({
            success: true,
            tracking: result.rows
        });

    } catch (error) {

        console.error("Tracking Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch tracking"
        });
    }
});

module.exports = router;