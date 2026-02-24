const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

/**
 * Initialize Socket.IO with the HTTP server.
 * Handles authentication, room management, and exposes
 * helper methods to emit order status updates from controllers.
 */
function setupSocket(server) {
    const { Server } = require('socket.io');

    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true
        }
    });

    // ── Authentication middleware ──
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) return next(new Error('Authentication required'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) return next(new Error('User not found'));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket.IO] User connected: ${socket.user.name} (${socket.user._id})`);

        // Join personal room so we can target notifications to specific users
        socket.join(`user_${socket.user._id}`);

        // Join role-based room (admin, delivery, customer)
        socket.join(`role_${socket.user.role}`);

        // ── Subscribe to a specific order's live updates ──
        socket.on('joinOrder', (orderId) => {
            socket.join(`order_${orderId}`);
            console.log(`[Socket.IO] ${socket.user.name} joined order room: order_${orderId}`);
        });

        socket.on('leaveOrder', (orderId) => {
            socket.leave(`order_${orderId}`);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket.IO] User disconnected: ${socket.user.name}`);
        });
    });

    console.log('[Socket.IO] Initialized');
    return io;
}

/**
 * Emit an order status update to everyone tracking that order,
 * the order owner, and all admins.
 */
function emitOrderUpdate(orderId, userId, data) {
    if (!io) return;
    // Broadcast to the order room (anyone on the tracking page)
    io.to(`order_${orderId}`).emit('orderStatusUpdate', data);
    // Also send to the order owner personally
    if (userId) {
        io.to(`user_${userId}`).emit('orderStatusUpdate', data);
    }
    // Notify all admins
    io.to('role_admin').emit('orderStatusUpdate', data);
}

/**
 * Emit a new order event (for admin dashboards).
 */
function emitNewOrder(orderData) {
    if (!io) return;
    io.to('role_admin').emit('newOrder', orderData);
}

/**
 * Emit a notification to a specific user.
 */
function emitNotification(userId, notification) {
    if (!io) return;
    io.to(`user_${userId}`).emit('notification', notification);
}

/**
 * Emit a notification to a role group.
 */
function emitRoleNotification(role, notification) {
    if (!io) return;
    io.to(`role_${role}`).emit('notification', notification);
}

/**
 * Get the io instance (for advanced usage in other modules).
 */
function getIO() {
    return io;
}

module.exports = {
    setupSocket,
    emitOrderUpdate,
    emitNewOrder,
    emitNotification,
    emitRoleNotification,
    getIO
};
