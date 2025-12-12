const db = require("./models");

async function migrate() {
  try {
    console.log("Connecting to database...");
    await db.sequelize.authenticate();
    console.log("Database connection established successfully.");

    console.log("Syncing database schema...");
    // Sync all models - this will create tables if they don't exist
    // force: false means it won't drop existing tables
    // alter: true means it will update tables to match the model definitions
    await db.sequelize.sync({ force: false, alter: true });
    console.log("Database schema synced successfully!");

    console.log("\nTables created/updated:");
    const tables = await db.sequelize.getQueryInterface().showAllTables();
    tables.forEach(table => console.log(`  - ${table}`));

    console.log("\nMigration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();

