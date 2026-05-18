const { query } = require("../db/db");
const bcrypt = require("bcryptjs");

// REGISTER USER
const registerUser = async (req, res) => {

    try {

        const {
    first_name,
    last_name,
    email,
    phone,
    password,
    role,
    company_name
} = req.body;

        // CHECK EXISTING USER
        const existingUser = await query(
            `
            SELECT *
            FROM customers
            WHERE email = $1
            `,
            [email]
        );

        if (existingUser.rows.length > 0) {

            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        // INSERT USER
        const hashedPassword =
await bcrypt.hash(password, 10);
        const result = await query(
            `
            INSERT INTO customers (
    first_name,
    last_name,
    email,
    phone,
    password,
    role,
    company_name
)
VALUES ($1,$2,$3,$4,$5,$6,$7)
RETURNING *
            `,
            [
                first_name,
                last_name,
                email,
                phone,
                hashedPassword,
                role || "user",
                company_name || null

            ]
        );

        res.status(201).json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};

// LOGIN USER
const loginUser = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        const result = await query(
            `
            SELECT *
            FROM customers
            WHERE email = $1
            `,
            [email]
        );

        if (result.rows.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid email"
            });
        }

        const user = result.rows[0];

        // PASSWORD CHECK
        const isPasswordValid =
await bcrypt.compare(
    password,
    user.password
);

if (!isPasswordValid) {

    return res.status(401).json({
        success: false,
        message: "Invalid password"
    });
}

        res.json({
            success: true,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                company_name: user.company_name
            }
        });

    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

// GET ALL COURIERS
const getAllCouriers = async (req, res) => {

    try {

        const result = await query(
            `
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                company_name,
                role,
                created_at
            FROM customers
            WHERE LOWER(role) = 'courier'
            ORDER BY created_at DESC
            `
        );

        res.json({
            success: true,
            couriers: result.rows
        });

    } catch (error) {

        console.error(
            "GET COURIERS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch couriers"
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getAllCouriers
};