const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./inscriptions.db", (err) => {
    if (err) {
        console.error("Erreur de connexion à SQLite :", err.message);
    } else {
        console.log("✅ Base de données SQLite connectée");
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS inscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        email TEXT NOT NULL,
        telephone TEXT NOT NULL,
        activite TEXT NOT NULL,
        date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error("Erreur de création de la table :", err.message);
    } else {
        console.log("✅ Table inscriptions prête");
    }
});

module.exports = db;