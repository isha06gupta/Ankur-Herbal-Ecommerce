const { query, transaction } = require('../db/db');

class OrderModel {
  // Create a new order with order items
  static async createOrder(orderData, orderItems) {
    return await transaction(async (client) => {
      // Generate unique order ID and order number
      const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
      
      // Insert order
      const orderQuery = `
        INSERT INTO orders (id, user_id, order_number, status, total_amount, shipping_address, billing_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const orderValues = [
        orderId,
        orderData.user_id,
        orderNumber,
        orderData.status || 'pending',
        orderData.total_amount,
        orderData.shipping_address,
        orderData.billing_address || orderData.shipping_address
      ];
      
      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];
      
      // Insert order items
      const itemQueries = orderItems.map(item => {
        const itemId = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const itemQuery = `
          INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        const itemValues = [
          itemId,
          order.id,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.total_price
        ];
        return client.query(itemQuery, itemValues);
      });
      
      const itemResults = await Promise.all(itemQueries);
      order.items = itemResults.map(result => result.rows[0]);
      
      return order;
    });
  }

  // Get all orders
  static async getAllOrders(limit = 50, offset = 0) {
    const orderQuery = `
      SELECT o.*, u.email, u.first_name, u.last_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const orderResult = await query(orderQuery, [limit, offset]);
    const orders = orderResult.rows;
    
    // Get order items for each order
    for (const order of orders) {
      const itemsQuery = `
        SELECT * FROM order_items
        WHERE order_id = $1
        ORDER BY id
      `;
      const itemsResult = await query(itemsQuery, [order.id]);
      order.items = itemsResult.rows;
    }
    
    return orders;
  }

  // Get orders by user ID
  static async getOrdersByUserId(userId, limit = 50, offset = 0) {
    const orderQuery = `
      SELECT * FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const orderResult = await query(orderQuery, [userId, limit, offset]);
    const orders = orderResult.rows;
    
    // Get order items for each order
    for (const order of orders) {
      const itemsQuery = `
        SELECT * FROM order_items
        WHERE order_id = $1
        ORDER BY id
      `;
      const itemsResult = await query(itemsQuery, [order.id]);
      order.items = itemsResult.rows;
    }
    
    return orders;
  }

  // Update order status
  static async updateOrderStatus(orderId, status) {
    const updateQuery = `
      UPDATE orders
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await query(updateQuery, [status, orderId]);
    return result.rows[0];
  }

  // Assign courier to order
  static async assignCourier(orderId, courierId, trackingNumber = null, estimatedDelivery = null) {
    const updateQuery = `
      UPDATE orders
      SET courier_id = $1, tracking_number = $2, estimated_delivery = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await query(updateQuery, [courierId, trackingNumber, estimatedDelivery, orderId]);
    return result.rows[0];
  }

  // Get order by ID
  static async getOrderById(orderId) {
    const orderQuery = `
      SELECT o.*, u.email, u.first_name, u.last_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    
    const orderResult = await query(orderQuery, [orderId]);
    if (orderResult.rows.length === 0) {
      return null;
    }
    
    const order = orderResult.rows[0];
    
    // Get order items
    const itemsQuery = `
      SELECT * FROM order_items
      WHERE order_id = $1
      ORDER BY id
    `;
    const itemsResult = await query(itemsQuery, [orderId]);
    order.items = itemsResult.rows;
    
    return order;
  }

  // Get order by order number
  static async getOrderByOrderNumber(orderNumber) {
    const orderQuery = `
      SELECT o.*, u.email, u.first_name, u.last_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.order_number = $1
    `;
    
    const orderResult = await query(orderQuery, [orderNumber]);
    if (orderResult.rows.length === 0) {
      return null;
    }
    
    const order = orderResult.rows[0];
    
    // Get order items
    const itemsQuery = `
      SELECT * FROM order_items
      WHERE order_id = $1
      ORDER BY id
    `;
    const itemsResult = await query(itemsQuery, [order.id]);
    order.items = itemsResult.rows;
    
    return order;
  }
}

module.exports = OrderModel;