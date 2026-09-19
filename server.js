```javascript
require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const { Resend } = require("resend");
const db = require("./database");

const app = express();

// Render fournit automatiquement le port.
// En local, le serveur utilisera 3000.
const PORT = process.env.PORT || 3000;

const resend = new Resend(process.env.RESEND_API_KEY);


// ========================================
// CONFIGURATION
// ========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || "change-this-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 4
        }
    })
);


// ========================================
// PAGE PUBLIQUE
// ========================================

app.use(
    express.static(__dirname, {
        index: false
    })
);


// ========================================
// CONNEXION ADMIN
// ========================================

app.post("/api/login", (req, res) => {

    const { username, password } = req.body;

    if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
    ) {

        req.session.isAdmin = true;

        return res.json({
            success: true
        });

    }

    res.status(401).json({
        success: false,
        message: "Identifiant ou mot de passe incorrect."
    });

});


// ========================================
// VÉRIFIER LA SESSION ADMIN
// ========================================

app.get("/api/admin/check", (req, res) => {

    if (req.session.isAdmin) {

        return res.json({
            authenticated: true
        });

    }

    res.status(401).json({
        authenticated: false
    });

});


// ========================================
// PROTÉGER ADMIN.HTML
// ========================================

app.get("/admin.html", (req, res) => {

    if (!req.session.isAdmin) {

        return res.redirect("/login.html");

    }

    res.sendFile(
        path.join(__dirname, "admin.html")
    );

});


// ========================================
// DÉCONNEXION
// ========================================

app.post("/api/logout", (req, res) => {

    req.session.destroy(() => {

        res.json({
            success: true
        });

    });

});


// ========================================
// ENREGISTRER UNE INSCRIPTION
// ========================================

app.post("/api/inscriptions", (req, res) => {

    const {
        name,
        email,
        phone,
        activity
    } = req.body;

    if (
        !name ||
        !email ||
        !phone ||
        !activity
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Tous les champs sont obligatoires."

        });

    }


    const sql = `
        INSERT INTO inscriptions
        (nom, email, telephone, activite)
        VALUES (?, ?, ?, ?)
    `;


    db.run(
        sql,
        [
            name,
            email,
            phone,
            activity
        ],
        async function (err) {

            if (err) {

                console.error(
                    "❌ ERREUR SQLite :",
                    err.message
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Erreur lors de l'enregistrement."

                });

            }


            console.log(
                "✅ Inscription enregistrée. ID :",
                this.lastID
            );


            // ========================================
            // EMAIL RESEND
            // ========================================

            try {

                const {
                    data,
                    error
                } = await resend.emails.send({

                    from:
                        "onboarding@resend.dev",

                    to:
                        "juniorbakanzo7@gmail.com",

                    subject:
                        "🔔 Nouvelle inscription - Junior Bakanzo",

                    html: `

                        <div
                            style="
                                font-family: Arial, sans-serif;
                                max-width: 600px;
                                margin: auto;
                            "
                        >

                            <h2
                                style="
                                    color: #071a33;
                                "
                            >
                                Nouvelle inscription
                            </h2>

                            <p>
                                Une nouvelle personne vient
                                de s'inscrire à une activité.
                            </p>

                            <hr>

                            <p>
                                <strong>Nom :</strong>
                                ${name}
                            </p>

                            <p>
                                <strong>E-mail :</strong>
                                ${email}
                            </p>

                            <p>
                                <strong>Téléphone :</strong>
                                ${phone}
                            </p>

                            <p>
                                <strong>Activité :</strong>
                                ${activity}
                            </p>

                            <hr>

                            <p>
                                Inscription enregistrée
                                dans la base de données.
                            </p>

                        </div>

                    `

                });


                if (error) {

                    console.error(
                        "❌ ERREUR RESEND :",
                        error
                    );

                } else {

                    console.log(
                        "📧 E-MAIL ENVOYÉ :",
                        data
                    );

                }

            } catch (emailError) {

                console.error(
                    "❌ ERREUR E-MAIL :",
                    emailError
                );

            }


            res.json({

                success: true,

                message:
                    "Inscription enregistrée avec succès !",

                id:
                    this.lastID

            });

        }
    );

});


// ========================================
// RÉCUPÉRER LES INSCRIPTIONS
// ========================================

app.get("/api/inscriptions", (req, res) => {

    if (!req.session.isAdmin) {

        return res.status(401).json({

            success: false,

            message:
                "Accès non autorisé."

        });

    }


    const sql = `
        SELECT *
        FROM inscriptions
        ORDER BY id DESC
    `;


    db.all(
        sql,
        [],
        (err, rows) => {

            if (err) {

                console.error(
                    "❌ ERREUR récupération :",
                    err.message
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Impossible de récupérer les inscriptions."

                });

            }

            res.json(rows);

        }
    );

});


// ========================================
// PAGE D'ACCUEIL
// ========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


// ========================================
// SERVEUR
// ========================================

app.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log(
        "================================"
    );

    console.log(
        "🚀 SERVEUR JUNIOR BAKANZO"
    );

    console.log(
        "================================"
    );

    console.log(
        `🌐 Serveur lancé sur le port ${PORT}`
    );

    console.log(
        "================================"
    );

    console.log("");

});
```
