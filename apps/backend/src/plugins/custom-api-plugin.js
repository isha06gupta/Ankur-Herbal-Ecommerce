const {
    registerRoutes,
    initializeDatabase
} = require("../api");

module.exports = async ({ app }) => {

    try {

        await initializeDatabase();

        registerRoutes(app);

        console.log(
            "✅ Custom API Plugin Loaded"
        );

    } catch (error) {

        console.error(
            "❌ Failed to load custom plugin:",
            error
        );
    }
};