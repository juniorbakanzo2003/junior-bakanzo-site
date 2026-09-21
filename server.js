require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const db = require("./database");
const { Resend } = require("resend");

const app = express();

const PORT = process.env.PORT || 3000;

const resend = new Resend(process.env.RESEND_API_KEY);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

// Fichiers publics
app.use(express.static(path.join(__dirname)));

// ==============================
// PAGE PRINCIPALE
// ==============================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ==============================
// CONNEXION ADMIN
// ==============================

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
    ) {
        req.session.admin = true;

        return res.json({
            success: true
        });
    }

    res.status(401).json({
        success: false,
        message: "Identifiants incorrects."
    });
});

// ==============================
// VÉRIFICATION SESSION ADMIN
// ==============================

app.get("/api/check-session", (req, res) => {
    res.json({
        loggedIn: !!req.session.admin
    });
});

// ==============================
// PAGE ADMIN PROTÉGÉE
// ==============================

app.get("/admin", (req, res) => {
    if (!req.session.admin) {
        return res.redirect("/login.html");
    }

    res.sendFile(path.join(__dirname, "admin.html"));
});

// ==============================
// DÉCONNEXION
// ==============================

app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Erreur lors de la déconnexion."
            });
        }

        res.json({
            success: true
        });
    });
});

// ==============================
// INSCRIPTION À UNE ACTIVITÉ
// ==============================

app.post("/api/inscriptions", (req, res) => {
    const { name, email, phone, activity } = req.body;

    if (!name || !email || !phone || !activity) {
        return res.status(400).json({
            success: false,
            message: "Veuillez remplir tous les champs."
        });
    }

    const sql = `
        INSERT INTO inscriptions
        (nom, email, telephone, activite)
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [name, email, phone, activity],
        async function (err) {
            if (err) {
                console.error("Erreur SQLite :", err);

                return res.status(500).json({
                    success: false,
                    message: "Erreur lors de l'enregistrement."
                });
            }

            console.log("✅ Nouvelle inscription :", this.lastID);

            // Envoi de l'e-mail
            try {
                await resend.emails.send({
                    from: "onboarding@resend.dev",
                    to: process.env.NOTIFICATION_EMAIL || "juniorbakanzo7@gmail.com",
                    subject: "Nouvelle inscription - Junior Bakanzo",
                    html: `
                        <h2>Nouvelle inscription</h2>

                        <p><strong>Nom :</strong> ${name}</p>
                        <p><strong>Email :</strong> ${email}</p>
                        <p><strong>Téléphone :</strong> ${phone}</p>
                        <p><strong>Activité :</strong> ${activity}</p>

                        <p>
                            Une nouvelle personne vient de s'inscrire
                            depuis votre site personnel.
                        </p>
                    `
                });

                console.log("📧 Notification envoyée.");
            } catch (emailError) {
                console.error(
                    "Erreur lors de l'envoi de l'e-mail :",
                    emailError
                );
            }

            res.json({
                success: true,
                message: "Inscription enregistrée avec succès."
            });
        }
    );
});

// ==============================
// RÉCUPÉRER LES INSCRIPTIONS
// ADMIN UNIQUEMENT
// ==============================

app.get("/api/inscriptions", (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({
            success: false,
            message: "Accès non autorisé."
        });
    }

    const sql = `
        SELECT
            id,
            nom,
            email,
            telephone,
            activite,
            date_inscription
        FROM inscriptions
        ORDER BY date_inscription DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Erreur SQLite :", err);

            return res.status(500).json({
                success: false,
                message: "Erreur lors de la récupération des inscriptions."
            });
        }

        res.json({
            success: true,
            inscriptions: rows
        });
    });
});

// ==============================
// DÉMARRAGE DU SERVEUR
// ==============================

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});