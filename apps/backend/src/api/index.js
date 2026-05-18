const express = require("express");

const orderRoutes = require("../routes/orderRoutes");
const trackingRoutes = require("../routes/trackingRoutes");

const MigrationRunner = require("../db/migrationRunner");

const migrationRunner = new MigrationRunner();

// Register routes
const registerRoutes = (app) => {

    app.use(
        "/api/orders",
        express.json(),
        orderRoutes
    );

    app.use(
        "/api/tracking",
        express.json(),
        trackingRoutes
    );

    console.log("✅ Custom API routes loaded");
};

// Initialize database
const initializeDatabase = async () => {

    try {

        await migrationRunner.runMigrations();

        console.log(
            "✅ Database migrations completed"
        );

    } catch (error) {

        console.error(
            "❌ Database migration failed:",
            error
        );
    }
};

module.exports = {
    registerRoutes,
    initializeDatabase
};