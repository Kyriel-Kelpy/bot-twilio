const express = require('express');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
const port = process.env.PORT || 8080;

// Middleware pour parser les données du formulaire
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // Ajout pour gérer les JSON

// Middleware pour logger toutes les requêtes
app.use((req, res, next) => {
    console.log(`Requête reçue : ${req.method} ${req.url}`);
    console.log("Body :", req.body);
    next();
});

// Route principale pour tester si le serveur tourne
app.get('/', (req, res) => {
    res.send("Le serveur fonctionne !");
});

// Route pour gérer les messages WhatsApp entrants
app.post('/whatsapp', (req, res) => {
    console.log("Message reçu de Twilio !", req.body);

    const incomingMsg = req.body.Body ? req.body.Body.trim().toLowerCase() : "";
    const from = req.body.From;

    const twiml = new MessagingResponse();

    // Logique du jeu
    if (incomingMsg === '/start') {
        twiml.message('Bienvenue dans le jeu du Loup ! Tapez /role pour voir votre rôle.');
    } else if (incomingMsg === '/role') {
        twiml.message('Vous êtes un Villageois.');
    } else {
        twiml.message('Commande non reconnue. Essayez /start ou /role.');
    }

    // Envoi de la réponse
    res.type('text/xml');
    res.send(twiml.toString());
});

// Gestion des erreurs pour éviter que l'app ne se ferme
app.use((err, req, res, next) => {
    console.error('Erreur serveur :', err);
    res.status(500).send('Quelque chose s\'est mal passé.');
});

// Démarrer le serveur avec un mécanisme de gestion d'erreurs
app.listen(port, () => {
    console.log(`✅ Serveur démarré sur le port ${port}`);
}).on('error', (err) => {
    console.error('Erreur de démarrage du serveur :', err);
    process.exit(1); // Si une erreur grave se produit, arrêter le processus
});
