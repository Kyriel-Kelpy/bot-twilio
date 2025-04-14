const twilio = require('twilio');
const accountSid = 'AC11ee726eb1532ae76beeb48a341e176c';  // Remplace par ton SID Twilio
const authToken = '7d20ceb067e19bbb753fd7ae027c1650'; // Remplace par ton Token Twilio
const client = new twilio(accountSid, authToken);
const fromNumber = 'whatsapp:+14155238886';  // Numéro WhatsApp Twilio

// Envoie un message privé à une personne
function sendPrivateMessage(to, message) {
    return client.messages.create({
        body: message,
        from: fromNumber,
        to: `whatsapp:${to}`
    })
    .then((message) => {
        console.log(`Message envoyé à ${to}: ${message.sid}`);
    })
    .catch((error) => {
        console.error(`Erreur lors de l'envoi à ${to}:`, error);
    });
}

// Envoie un message au meneur pour qu’il le partage au groupe
function sendGroupMessage(message, joueurs) {
    const meneur = joueurs.find(j => j.role === 'Meneur');
    if (!meneur) {
        console.error('Aucun meneur trouvé.');
        return;
    }

    const msg = `📣 Message à partager dans le groupe :\n\n${message}`;
    return sendPrivateMessage(meneur.phone, msg);
}

module.exports = {
    sendPrivateMessage,
    sendGroupMessage
};
