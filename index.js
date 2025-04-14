const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const {
    handleStartCommand,
    handleParticipateCommand,
    handleRolesCommand
} = require('./commandes');
const { joueurs, phase } = require('./variables');

const app = express();
const port = 8080;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post('/whatsapp', (req, res) => {
    const msg = req.body.Body.trim().toLowerCase();
    const from = req.body.From;
    const twiml = new MessagingResponse();

    let réponse = '';

    switch (msg) {
        case '/start':
            réponse = handleStartCommand(from, joueurs);
            break;
        case '/participate':
            réponse = handleParticipateCommand(from);
            break;
        case '/roles':
            réponse = handleRolesCommand();
            break;
        default:
            réponse = 'Commande inconnue. Essayez : /start, /participate, /roles.';
    }

    twiml.message(réponse);
    res.type('text/xml');
    res.send(twiml.toString());
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
