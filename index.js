const express = require('express');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
const port = process.env.PORT || 8080;  // Utiliser le port 8080 par défaut ou le port fourni par Railway

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

// Route favicon (facultatif, pour éviter des erreurs liées au favicon)
app.get('/favicon.ico', (req, res) => res.status(204).send());

// Démarrer le serveur
app.listen(port, () => {
    console.log(`✅ Serveur démarré sur le port ${port}`);
});

// Garder le serveur actif en permanence
setInterval(() => {}, 1000);  // Cette ligne permet de garder le serveur actif sans qu'il se ferme.
