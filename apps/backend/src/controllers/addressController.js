const { query } = require("../db/db");

// GET USER ADDRESSES
const getAddresses = async (req, res) => {

    try {

        const customerId = req.params.customerId;

        const result = await query(
            `
            SELECT *
            FROM shipment_address
            WHERE customer_id = $1
            ORDER BY created_at DESC
            `,
            [customerId]
        );

        res.json({
            success: true,
            addresses: result.rows
        });

    } catch (error) {

        console.error(
            "GET ADDRESS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch addresses"
        });
    }
};

// CREATE ADDRESS
const createAddress = async (req, res) => {

    try {

        const {
            customer_id,
            first_name,
            last_name,
            phone,
            address_1,
            city,
            province,
            postal_code,
            country_code
        } = req.body;

        const result = await query(
            `
            INSERT INTO shipment_address (
                customer_id,
                first_name,
                last_name,
                phone,
                address_1,
                city,
                province,
                postal_code,
                country_code
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *
            `,
            [
                customer_id,
                first_name,
                last_name,
                phone,
                address_1,
                city,
                province,
                postal_code,
                country_code
            ]
        );

        res.status(201).json({
            success: true,
            address: result.rows[0]
        });

    } catch (error) {

        console.error(
            "CREATE ADDRESS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to create address"
        });
    }
};

module.exports = {
    getAddresses,
    createAddress
};