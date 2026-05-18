const { query } = require("../db/db");

// FORMAT TRACKING STATUS
function formatTrackingStatus(status) {

    if (!status) return 'Order Placed';

    return status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// CREATE ORDER
const createOrder = async (req, res) => {

    try {

        const {
            customer,
            items,
            subtotal,
            total_amount,
            payment_status,
            order_status,
            razorpay_payment_id
        } = req.body;

        // CHECK EXISTING CUSTOMER
        const existingCustomer = await query(
            `
            SELECT *
            FROM customers
            WHERE email = $1
            `,
            [customer.email]
        );

        let customerId;

        if (existingCustomer.rows.length > 0) {

            customerId = existingCustomer.rows[0].id;

        } else {

            const customerResult = await query(
                `
                INSERT INTO customers (
                    first_name,
                    email,
                    phone,
                    address
                )
                VALUES ($1, $2, $3, $4)
                RETURNING *
                `,
                [
                    customer.name,
                    customer.email,
                    customer.phone,
                    customer.address
                ]
            );

            customerId = customerResult.rows[0].id;
        }

        // CREATE ORDER ID
        const orderId = "ORD-" + Date.now();

        // INSERT ORDER
        const orderResult = await query(
            `
            INSERT INTO orders (
                order_id,
                customer_id,
                razorpay_payment_id,
                subtotal,
                total_amount,
                payment_status,
                order_status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *
            `,
            [
                orderId,
                customerId,
                razorpay_payment_id,
                subtotal,
                total_amount,
                payment_status,
                order_status
            ]
        );

        const orderData = orderResult.rows[0];

        // INITIAL TRACKING ENTRY
        await query(
            `
            INSERT INTO shipment_tracking (
                order_id,
                tracking_status,
                tracking_message,
                location,
                courier_name,
                shipment_id
            )
            VALUES ($1,$2,$3,$4,$5,$6)
            `,
            [
                orderData.id,
                'Order Placed',
                'Your order has been placed successfully',
                'Warehouse',
                null,
                null
            ]
        );

        // INSERT ORDER ITEMS
        for (const item of items) {

            await query(
                `
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    product_title,
                    quantity,
                    price,
                    image_url
                )
                VALUES ($1,$2,$3,$4,$5,$6)
                `,
                [
                    orderData.id,
                    item.id,
                    item.product_title || item.title || item.name,
                    item.quantity,
                    item.price,
                    item.thumbnail || item.image || ''
                ]
            );
        }

        res.status(201).json({
            success: true,
            order: orderData
        });

    } catch (error) {

        console.error("ORDER ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create order"
        });
    }
};

// GET ALL ORDERS
const getAllOrders = async (req, res) => {

    try {

        const ordersResult = await query(
            `
            SELECT
                orders.*,
                customers.first_name,
                customers.email,
                customers.phone,
                customers.address
            FROM orders
            JOIN customers
            ON orders.customer_id = customers.id
            ORDER BY orders.created_at DESC
            `
        );

        const orders = ordersResult.rows;

        for (const order of orders) {

            const itemsResult = await query(
                `
                SELECT *
                FROM order_items
                WHERE order_id = $1
                `,
                [order.id]
            );

            order.items = itemsResult.rows;
        }

        res.status(200).json({
            success: true,
            orders
        });

    } catch (error) {

        console.error("GET ORDERS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch orders"
        });
    }
};

// UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {

    try {

        const { orderId } = req.params;

        const { status } = req.body;

        // UPDATE ORDER STATUS
        const result = await query(
            `
            UPDATE orders
            SET order_status = $1,
                updated_at = NOW()
            WHERE order_id = $2
            RETURNING *
            `,
            [status, orderId]
        );

        // INSERT TRACKING ENTRY
        await query(
            `
            INSERT INTO shipment_tracking (
                order_id,
                tracking_status,
                tracking_message,
                location,
                created_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                NOW()
            )
            `,
            [
                result.rows[0].id,
                formatTrackingStatus(status),
                `Order status updated to ${formatTrackingStatus(status)}`,
                'Warehouse'
            ]
        );

        res.json({
            success: true,
            order: result.rows[0]
        });

    } catch (error) {

        console.error("UPDATE STATUS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update order status"
        });
    }
};

// UPDATE COURIER

const updateCourier = async (req, res) => {

    try {

        const { orderId } = req.params;

        const {
            courier_name,
            assigned_courier_email,
            assigned_courier_id
        } = req.body;

        const result = await query(
            `
            UPDATE orders
            SET
                courier_name = $1,
                assigned_courier_email = $2,
                assigned_courier_id = $3
            WHERE order_id = $4
            RETURNING *
            `,
            [
                courier_name,
                assigned_courier_email,
                assigned_courier_id,
                orderId
            ]
        );

        res.json({
            success: true,
            order: result.rows[0]
        });

    } catch (error) {

        console.error(
            "UPDATE COURIER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to assign courier"
        });
    }
};
// GENERATE SHIPMENT ID
const generateShipmentId = async (req, res) => {

    try {

        const { orderId } = req.params;

        const shipmentId =
            "SHP-" +
            Math.floor(100000 + Math.random() * 900000);

        const result = await query(
            `
            UPDATE orders
            SET shipment_id = $1
            WHERE order_id = $2
            RETURNING *
            `,
            [shipmentId, orderId]
        );

        res.json({
            success: true,
            shipment_id: shipmentId,
            order: result.rows[0]
        });

    } catch (error) {

        console.error("SHIPMENT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate shipment ID"
        });
    }
};

const getCourierOrders = async (req, res) => {

    try {

        const { email } = req.params;

        const result = await query(
            `
            SELECT
                orders.*,
                customers.first_name,
                customers.email,
                customers.phone,
                customers.address
            FROM orders
            JOIN customers
            ON orders.customer_id = customers.id
            WHERE orders.assigned_courier_email = $1
            ORDER BY orders.created_at DESC
            `,
            [email]
        );

        const orders = result.rows;

        for (const order of orders) {

            const itemsResult = await query(
                `
                SELECT *
                FROM order_items
                WHERE order_id = $1
                `,
                [order.id]
            );

            order.items = itemsResult.rows;
        }

        res.json({
            success: true,
            orders
        });

    } catch (error) {

        console.error(
            "GET COURIER ORDERS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch courier orders"
        });
    }
};
module.exports = {
    createOrder,
    getAllOrders,
    updateOrderStatus,
    updateCourier,
    generateShipmentId,
    getCourierOrders
};