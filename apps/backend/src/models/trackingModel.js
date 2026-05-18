const { query } = require('../db/db');

class TrackingModel {
  // Create a new tracking entry
  static async createTracking(trackingData) {
    const trackingId = 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const insertQuery = `
      INSERT INTO tracking (id, order_id, status, location, description, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      trackingId,
      trackingData.order_id,
      trackingData.status,
      trackingData.location || null,
      trackingData.description || null,
      trackingData.timestamp || new Date()
    ];
    
    const result = await query(insertQuery, values);
    return result.rows[0];
  }

  // Get all tracking entries for an order
  static async getTrackingByOrderId(orderId) {
    const selectQuery = `
      SELECT * FROM tracking
      WHERE order_id = $1
      ORDER BY timestamp DESC
    `;
    
    const result = await query(selectQuery, [orderId]);
    return result.rows;
  }

  // Get latest tracking entry for an order
  static async getLatestTracking(orderId) {
    const selectQuery = `
      SELECT * FROM tracking
      WHERE order_id = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    const result = await query(selectQuery, [orderId]);
    return result.rows[0] || null;
  }

  // Get tracking by ID
  static async getTrackingById(trackingId) {
    const selectQuery = `
      SELECT t.*, o.order_number, o.user_id
      FROM tracking t
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE t.id = $1
    `;
    
    const result = await query(selectQuery, [trackingId]);
    return result.rows[0] || null;
  }

  // Update tracking entry
  static async updateTracking(trackingId, trackingData) {
    const updateQuery = `
      UPDATE tracking
      SET status = $1, location = $2, description = $3, timestamp = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [
      trackingData.status,
      trackingData.location || null,
      trackingData.description || null,
      trackingData.timestamp || new Date(),
      trackingId
    ];
    
    const result = await query(updateQuery, values);
    return result.rows[0];
  }

  // Delete tracking entry
  static async deleteTracking(trackingId) {
    const deleteQuery = `
      DELETE FROM tracking
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(deleteQuery, [trackingId]);
    return result.rows[0];
  }

  // Get all tracking entries with pagination
  static async getAllTracking(limit = 50, offset = 0) {
    const selectQuery = `
      SELECT t.*, o.order_number, o.user_id
      FROM tracking t
      LEFT JOIN orders o ON t.order_id = o.id
      ORDER BY t.timestamp DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await query(selectQuery, [limit, offset]);
    return result.rows;
  }

  // Get tracking by status
  static async getTrackingByStatus(status, limit = 50, offset = 0) {
    const selectQuery = `
      SELECT t.*, o.order_number, o.user_id
      FROM tracking t
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE t.status = $1
      ORDER BY t.timestamp DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await query(selectQuery, [status, limit, offset]);
    return result.rows;
  }

  // Get tracking count for an order
  static async getTrackingCount(orderId) {
    const countQuery = `
      SELECT COUNT(*) as count
      FROM tracking
      WHERE order_id = $1
    `;
    
    const result = await query(countQuery, [orderId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = TrackingModel;
