const TrackingModel = require('../models/trackingModel');
const OrderModel = require('../models/orderModel');

class TrackingController {
  // POST /api/tracking - Create a new tracking entry
  static async createTracking(req, res) {
    try {
      const { order_id, status, location, description, timestamp } = req.body;

      // Validate required fields
      if (!order_id || !status) {
        return res.status(400).json({
          error: 'Missing required fields: order_id, status'
        });
      }

      // Check if order exists
      const order = await OrderModel.getOrderById(order_id);
      if (!order) {
        return res.status(404).json({
          error: 'Order not found'
        });
      }

      const trackingData = {
        order_id,
        status,
        location,
        description,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      };

      const tracking = await TrackingModel.createTracking(trackingData);

      res.status(201).json({
        message: 'Tracking entry created successfully',
        tracking
      });
    } catch (error) {
      console.error('Error creating tracking:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // GET /api/tracking/order/:orderId - Get all tracking for an order
  static async getTrackingByOrderId(req, res) {
    try {
      const orderId = req.params.orderId;

      if (!orderId) {
        return res.status(400).json({
          error: 'Order ID is required'
        });
      }

      // Check if order exists
      const order = await OrderModel.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          error: 'Order not found'
        });
      }

      const tracking = await TrackingModel.getTrackingByOrderId(orderId);

      res.status(200).json({
        message: 'Tracking entries retrieved successfully',
        tracking,
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status
        }
      });
    } catch (error) {
      console.error('Error getting tracking:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // GET /api/tracking/:id - Get tracking by ID
  static async getTrackingById(req, res) {
    try {
      const trackingId = req.params.id;

      if (!trackingId) {
        return res.status(400).json({
          error: 'Tracking ID is required'
        });
      }

      const tracking = await TrackingModel.getTrackingById(trackingId);

      if (!tracking) {
        return res.status(404).json({
          error: 'Tracking entry not found'
        });
      }

      res.status(200).json({
        message: 'Tracking entry retrieved successfully',
        tracking
      });
    } catch (error) {
      console.error('Error getting tracking:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // GET /api/tracking/latest/order/:orderId - Get latest tracking for an order
  static async getLatestTracking(req, res) {
    try {
      const orderId = req.params.orderId;

      if (!orderId) {
        return res.status(400).json({
          error: 'Order ID is required'
        });
      }

      // Check if order exists
      const order = await OrderModel.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          error: 'Order not found'
        });
      }

      const tracking = await TrackingModel.getLatestTracking(orderId);

      res.status(200).json({
        message: 'Latest tracking entry retrieved successfully',
        tracking,
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status
        }
      });
    } catch (error) {
      console.error('Error getting latest tracking:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // GET /api/tracking - Get all tracking entries
  static async getAllTracking(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const tracking = await TrackingModel.getAllTracking(limit, offset);

      res.status(200).json({
        message: 'Tracking entries retrieved successfully',
        tracking,
        pagination: {
          limit,
          offset,
          count: tracking.length
        }
      });
    } catch (error) {
      console.error('Error getting all tracking:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // PUT /api/tracking/:id - Update tracking entry
  static async updateTracking(req, res) {
    try {
      const trackingId = req.params.id;
      const { status, location, description, timestamp } = req.body;

      if (!trackingId) {
        return res.status(400).json({
          error: 'Tracking ID is required'
        });
      }

      if (!status) {
        return res.status(400).json({
          error: 'Status is required'
        });
      }

      const trackingData = {
        status,
        location,
        description,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      };

      const tracking = await TrackingModel.updateTracking(trackingId, trackingData);

      if (!tracking) {
        return res.status(404).json({
          error: 'Tracking entry not found'
        });
      }

      res.status(200).json({
        message: 'Tracking entry updated successfully',
        tracking
      });
    } catch (error) {
      console.error('Error updating tracking:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // DELETE /api/tracking/:id - Delete tracking entry
  static async deleteTracking(req, res) {
    try {
      const trackingId = req.params.id;

      if (!trackingId) {
        return res.status(400).json({
          error: 'Tracking ID is required'
        });
      }

      const tracking = await TrackingModel.deleteTracking(trackingId);

      if (!tracking) {
        return res.status(404).json({
          error: 'Tracking entry not found'
        });
      }

      res.status(200).json({
        message: 'Tracking entry deleted successfully',
        tracking
      });
    } catch (error) {
      console.error('Error deleting tracking:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

module.exports = TrackingController;