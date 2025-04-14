const { pseudos, roles, joueurs, votes, phase, sousPhase, nightVotes } = require('./variables');  // Ajout de 'nightVotes' et 'sousPhase'
const { sendPrivateMessage, sendGroupMessage } = require('./helpers'); // Import des fonctions helpers

// Shuffle utilitaire
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

function handleChangerPhaseCommand(from, msg) {
    const partie = parties[from];
    if (!partie) return "Aucune partie trouvée.";
  
    const joueur = partie.joueurs.find(j => j.numero === from);
    if (!joueur || joueur.role !== 'meneur') {
      return "Seul le meneur peut changer de phase.";
    }
  
    // Gestion des transitions
    const { phase, sousPhase } = partie;
  
    if (phase === 'nuit') {
      if (sousPhase === 'loup') {
        partie.sousPhase = 'pouvoirs';
        return "Sous-phase passée à : pouvoirs.";
      } else {
        partie.phase = 'jour';
        partie.sousPhase = 'tempsDeVote';
        partie.jour += 1;
        return "Phase passée à : jour.";
      }
    } else if (phase === 'jour') {
      if (sousPhase === 'tempsDeVote') {
        partie.sousPhase = 'resultatVote';
        return "Sous-phase passée à : résultat du vote.";
      } else if (sousPhase === 'resultatVote') {
        partie.sousPhase = 'activationMort';
        return "Sous-phase passée à : activation des morts.";
      } else {
        partie.phase = 'nuit';
        partie.sousPhase = 'loup';
        partie.nuit += 1;
        return "Phase passée à : nuit.";
      }
    }
  
    return "Erreur dans la transition de phase.";
  }
  

// Fonction pour gérer la commande /start
function handleStartCommand(from, joueurs) {
    if (joueurs.length === 0) {
        joueurs.push({ phone: from, pseudo: 'Meneur', role: 'Meneur' });
        return 'Bienvenue dans le jeu du Loup ! Tapez /participate pour rejoindre la partie.';
    } else {
        return 'Un meneur est déjà désigné. Seul lui peut gérer le jeu.';
    }
}

// Fonction pour gérer la commande /participate
function handleParticipateCommand(from) {
    if (joueurs.find(j => j.phone === from)) {
        return 'Vous êtes déjà inscrit dans la partie.';
    } else if (joueurs.length >= 30) {
        return 'Le nombre maximal de joueurs est atteint.';
    } else {
        const pseudo = pseudos[joueurs.length];
        joueurs.push({ phone: from, pseudo });
        return `Vous êtes inscrit sous le pseudo ${pseudo}.`;
    }
}

// Fonction pour gérer la commande /roles
function handleRolesCommand() {
    if (joueurs.length < 30) {
        return 'Il n\'y a pas encore 30 joueurs.';
    }

    const rolesDisponibles = [...roles];
    const rolesDistribués = shuffleArray(rolesDisponibles);

    if (rolesDisponibles.length < joueurs.length - 1) {
        return 'Pas assez de rôles pour tous les joueurs !';
    }

    joueurs.forEach(j => {
        if (j.role !== 'Meneur') {
            const roleAttribué = rolesDistribués.pop();
            j.role = roleAttribué.nom;
            j.roleData = roleAttribué;
        }
    });

    // Envoi individuel des rôles
    joueurs.forEach(j => {
        if (j.role !== 'Meneur') {
            const role = j.roleData;
            const msgPrivé = 
`🎭 Salut ${j.pseudo} !

🧩 Ton rôle est : *${role.nom}*

📖 Description : ${role.description}

📜 Commandes disponibles : ${role.commandes.length > 0 ? role.commandes.join(', ') : 'Aucune'}

⏰ Utilisation : ${role.utilisation}
🕓 Moment : ${role.moment}

Pour utiliser une commande spécifique, écris-la en ciblant un joueur par son *pseudo* :
Ex. : /kill ChatonBrave
`;

            sendPrivateMessage(j.phone, msgPrivé); // Envoi avec le bon attribut `phone`
        }
    });

    // Message d'annonce dans le groupe
    const tagsEtPseudos = joueurs.map(j => `• ${j.pseudo}`).join('\n');
    const annonce = 
`🎉 Tous les joueurs ont reçu leur rôle en privé.

🧑‍🤝‍🧑 Voici la liste des participants :

${tagsEtPseudos}

🎮 Le jeu peut enfin commencer ! Le meneur peut maintenant lancer la première nuit avec la commande /night
`;

    sendGroupMessage(annonce); // Envoi dans le groupe

    return 'Les rôles ont été attribués et envoyés en privé à chaque joueur.';
}

// Fonction pour gérer la commande /see (Voyante)
function handleSeeCommand(from, msg) {
    if (phase !== 'nuit' || sousPhase !== 'pouvoirs') {
        return 'La commande /see ne peut être utilisée que pendant la sous-phase de pouvoirs spéciaux durant la phase de nuit.';
    }

    // Vérification du rôle de la Voyante
    const joueur = joueurs.find(j => j.phone === from && j.role === 'Voyante');
    if (!joueur) {
        return 'Seul un joueur avec le rôle de Voyante peut utiliser cette commande.';
    }

    // Vérifier que la Voyante n'a pas déjà utilisé sa commande
    if (joueur.roleUsed) {
        return 'Vous avez déjà utilisé votre pouvoir de Voyante pour cette nuit.';
    }

    // Extraction du pseudo du joueur cible dans la commande
    const ciblePseudo = msg.split(' ')[1];

    if (!ciblePseudo) {
        return 'Vous devez spécifier le pseudo du joueur dont vous souhaitez connaître le rôle.';
    }

    // Vérifier si le joueur cible existe dans la liste des joueurs
    const joueurCible = joueurs.find(j => j.pseudo.toLowerCase() === ciblePseudo.toLowerCase());
    if (!joueurCible) {
        return `Le joueur ${ciblePseudo} n'existe pas. Assurez-vous d'écrire le pseudo correctement.`;
    }

    // Marquer que la Voyante a utilisé son pouvoir
    joueur.roleUsed = true;

    // Retourner le rôle du joueur ciblé
    return `Le rôle de ${ciblePseudo} est : *${joueurCible.role}*`;
}

// Fonction pour gérer la commande /kill
function handleKillCommand(from, msg) {
    if (phase !== 'nuit' || sousPhase !== 'loups') {
        return 'La commande /kill ne peut être utilisée que durant la sous-phase des loups.';
    }

    // Vérification du rôle du joueur (Loup-Garou, Loup Solitaire ou Loup Alpha)
    const joueur = joueurs.find(j => j.phone === from);
    if (['Loup-Garou', 'Loup Solitaire', 'Loup Alpha'].indexOf(joueur.role) === -1) {
        return 'Vous n\'êtes pas un loup-garou et ne pouvez donc pas utiliser cette commande.';
    }

    // Extraction du pseudo du joueur à tuer
    const victimePseudo = msg.split(' ')[1];

    if (!victimePseudo) {
        return 'Vous devez spécifier le pseudo du joueur à tuer après la commande /kill.';
    }

    // Vérifier si la victime existe dans la liste des joueurs
    const victime = joueurs.find(j => j.pseudo.toLowerCase() === victimePseudo.toLowerCase());
    if (!victime) {
        return `Le joueur ${victimePseudo} n'existe pas. Assurez-vous d'écrire le pseudo correctement.`;
    }

    // Enregistrer le vote
    const role = joueur.role;
    if (role === 'Loup Alpha') {
        nightVotes.push({ phone: from, victim: victime.phone, poids: 2 });
    } else {
        nightVotes.push({ phone: from, victim: victime.phone, poids: 1 });
    }

    return `Vous avez choisi de tuer ${victimePseudo}.`;
}


// Fonction pour gérer la commande /heal (Sorcière)
function handleHealCommand(from, msg) {
    if (phase !== 'nuit' || sousPhase !== 'pouvoirs') {
        return 'La commande /heal ne peut être utilisée que pendant la sous-phase de pouvoirs spéciaux durant la nuit.';
    }

    const joueur = joueurs.find(j => j.phone === from && j.role === 'Sorcière');
    if (!joueur) {
        return 'Seule la Sorcière peut utiliser cette commande.';
    }

    if (joueur.healUsed) {
        return 'Vous avez déjà utilisé votre potion de guérison.';
    }

    const ciblePseudo = msg.split(' ')[1];
    if (!ciblePseudo) {
        return 'Vous devez spécifier le pseudo du joueur que vous voulez sauver. Exemple : /heal LoupMignon';
    }

    const cible = joueurs.find(j => j.pseudo.toLowerCase() === ciblePseudo.toLowerCase());
    if (!cible) {
        return `Le joueur ${ciblePseudo} n'existe pas.`;
    }

    joueur.healUsed = true;
    nightVotes.push({ phone: from, victim: cible.phone, poids: -999, source: 'heal' });

    return `Vous avez utilisé votre potion de guérison pour sauver ${ciblePseudo}.`;
}

// Fonction pour gérer la commande /poison (Sorcière)
function handlePoisonCommand(from, msg) {
    if (phase !== 'nuit' || sousPhase !== 'pouvoirs') {
        return 'La commande /poison ne peut être utilisée que pendant la sous-phase de pouvoirs spéciaux durant la nuit.';
    }

    const joueur = joueurs.find(j => j.phone === from && j.role === 'Sorcière');
    if (!joueur) {
        return 'Seule la Sorcière peut utiliser cette commande.';
    }

    if (joueur.poisonUsed) {
        return 'Vous avez déjà utilisé votre potion de poison.';
    }

    const ciblePseudo = msg.split(' ')[1];
    if (!ciblePseudo) {
        return 'Vous devez spécifier le pseudo du joueur que vous voulez empoisonner. Exemple : /poison LoupMignon';
    }

    const cible = joueurs.find(j => j.pseudo.toLowerCase() === ciblePseudo.toLowerCase());
    if (!cible) {
        return `Le joueur ${ciblePseudo} n'existe pas.`;
    }

    joueur.poisonUsed = true;
    nightVotes.push({ phone: from, victim: cible.phone, poids: 999, source: 'poison' });

    return `Vous avez utilisé votre potion de poison sur ${ciblePseudo}.`;
}

function handleLoveCommand(from, msg) {
    if (phase !== 'nuit' || sousPhase !== 'nuit0') {
        return 'La commande /love ne peut être utilisée que pendant la nuit 0.';
    }

    const cupidon = joueurs.find(j => j.phone === from && j.role === 'Cupidon');
    if (!cupidon) {
        return 'Seul le joueur avec le rôle de Cupidon peut utiliser cette commande.';
    }

    if (cupidon.roleUsed) {
        return 'Vous avez déjà utilisé votre pouvoir.';
    }

    const pseudosChoisis = msg.split(' ').slice(1);
    if (pseudosChoisis.length !== 2) {
        return 'Vous devez désigner deux joueurs amoureux. Exemple : /love ChatonBrave LoupGentil';
    }

    const amoureux = pseudosChoisis.map(pseudo =>
        joueurs.find(j => j.pseudo.toLowerCase() === pseudo.toLowerCase())
    );

    if (amoureux.includes(undefined)) {
        return 'Un ou plusieurs pseudos sont incorrects. Vérifiez l’orthographe des noms.';
    }

    // Enregistrement des amoureux
    amoureux[0].amoureux = amoureux[1].phone;
    amoureux[1].amoureux = amoureux[0].phone;
    cupidon.roleUsed = true;

    sendPrivateMessage(amoureux[0].phone, `💘 Vous êtes tombé amoureux de ${amoureux[1].pseudo}. Si l’un de vous meurt, l’autre le suivra dans la tombe...`);
    sendPrivateMessage(amoureux[1].phone, `💘 Vous êtes tombé amoureux de ${amoureux[0].pseudo}. Si l’un de vous meurt, l’autre le suivra dans la tombe...`);

    return `Vous avez uni ${amoureux[0].pseudo} et ${amoureux[1].pseudo} par l’amour. 💘`;
}


// Fonction pour gérer la commande /guard (Chevalier)
function handleGuardCommand(from, msg) {
    if (phase !== 'nuit' || sousPhase !== 'pouvoirs') {
        return 'La commande /guard ne peut être utilisée que pendant la sous-phase des pouvoirs pendant la nuit.';
    }

    const chevalier = joueurs.find(j => j.phone === from && j.role === 'Chevalier');
    if (!chevalier) {
        return 'Seul le Chevalier peut utiliser la commande /guard.';
    }

    if (chevalier.roleUsed) {
        return 'Vous avez déjà protégé quelqu’un cette nuit.';
    }

    const ciblePseudo = msg.split(' ')[1];
    if (!ciblePseudo) {
        return 'Vous devez spécifier le pseudo du joueur à protéger.';
    }

    const cible = joueurs.find(j => j.pseudo.toLowerCase() === ciblePseudo.toLowerCase());
    if (!cible) {
        return `Le joueur ${ciblePseudo} n'existe pas.`;
    }

    // Vérifie si c’est la même cible que la nuit précédente
    if (chevalier.lastGuarded === cible.pseudo) {
        return 'Vous ne pouvez pas protéger la même personne deux nuits de suite.';
    }

    // Enregistrement de la protection
    nightVotes.push({
        phone: from,
        protected: cible.phone,
        poids: 1,
        type: 'guard'
    });

    chevalier.roleUsed = true;
    chevalier.lastGuarded = cible.pseudo;

    return `Vous avez protégé ${cible.pseudo} cette nuit.`;
}


// Fonction pour gérer la commande /shoot (Chasseur)
function handleShootCommand(from, msg) {
    const joueur = joueurs.find(j => j.phone === from && j.role === 'Chasseur');

    if (!joueur) {
        return 'Seul un joueur avec le rôle de Chasseur peut utiliser cette commande.';
    }

    if (!joueur.estMort) {
        return 'Vous ne pouvez tirer que si vous êtes mort.';
    }

    if (joueur.aTire) {
        return 'Vous avez déjà utilisé votre tir.';
    }

    const ciblePseudo = msg.split(' ')[1];

    if (!ciblePseudo) {
        return 'Vous devez spécifier le pseudo du joueur que vous souhaitez tirer.';
    }

    const cible = joueurs.find(j => j.pseudo.toLowerCase() === ciblePseudo.toLowerCase());

    if (!cible) {
        return `Le joueur ${ciblePseudo} n'existe pas.`;
    }

    // Marquer que le chasseur a tiré
    joueur.aTire = true;

    // Marquer la cible comme morte
    cible.estMort = true;

    // Informer le groupe de la mort de la cible
    sendGroupMessage(`🔫 Dans un dernier souffle, ${joueur.pseudo} a tiré sur ${cible.pseudo}, qui meurt sur le coup.`);

    return `Vous avez tiré sur ${cible.pseudo}.`;
}

function handleCharmCommand(from, msg) {
    const { phase, subPhase, joueurs } = getGameState();
    const flute = getJoueur(from);
  
    if (!flute || flute.role !== 'Joueur de Flûte') return '❌ Vous ne pouvez pas utiliser cette commande.';
    if (phase !== 'nuit' || subPhase !== 'flute') return '❌ Ce n\'est pas le moment pour cette commande.';
    if (flute.aEnvouteCetteNuit) return '❌ Vous avez déjà envouté deux joueurs cette nuit.';
  
    const pseudos = msg.split(' ').slice(1);
    if (pseudos.length !== 2) return '❌ Utilisation : /charm <pseudo1> <pseudo2>';
  
    const [j1, j2] = pseudos.map(p => getJoueurByPseudo(p));
    if (!j1 || !j2 || j1.estMort || j2.estMort || j1.phone === j2.phone) {
      return '❌ Joueurs invalides ou déjà morts.';
    }
  
    flute.joueursEnvoutés = flute.joueursEnvoutés || [];
    if (flute.joueursEnvoutés.includes(j1.phone) && flute.joueursEnvoutés.includes(j2.phone)) {
      return '❌ Ces deux joueurs sont déjà envoutés.';
    }
  
    flute.joueursEnvoutés.push(j1.phone);
    flute.joueursEnvoutés.push(j2.phone);
    flute.aEnvouteCetteNuit = true;
  
    sendPrivateMessage(j1.phone, '🎶 Une douce mélodie vous trouble... Vous vous sentez envouté.');
    sendPrivateMessage(j2.phone, '🎶 Une douce mélodie vous trouble... Vous vous sentez envouté.');
    return `🎵 Vous avez envouté ${j1.pseudo} et ${j2.pseudo}.`;
}
  

function handleParierCommand(from, msg) {
    if (phase !== 'nuit' || sousPhase !== 'pouvoirs') {
        return 'La commande /parier ne peut être utilisée que pendant la sous-phase de pouvoirs spéciaux durant la nuit.';
    }

    const joueur = joueurs.find(j => j.phone === from && j.role === 'Parieur');
    if (!joueur) {
        return 'Seul un Parieur peut utiliser cette commande.';
    }

    if (joueur.aParie) {
        return 'Vous avez déjà fait votre pari cette nuit.';
    }

    const ciblePseudo = msg.split(' ')[1];
    if (!ciblePseudo) {
        return 'Vous devez spécifier le pseudo du joueur sur lequel vous pariez. Exemple : /parier LoupMignon';
    }

    const cible = joueurs.find(j => j.pseudo.toLowerCase() === ciblePseudo.toLowerCase());
    if (!cible) {
        return `Le joueur ${ciblePseudo} n'existe pas.`;
    }

    joueur.pari = ciblePseudo;
    joueur.aParie = true;

    return `Vous avez parié que **${ciblePseudo}** sera la cible des loups cette nuit.`;
}

function handleBetrayCommand(from, msg) {
    if (phase !== 'nuit' || sousPhase !== 'pouvoirs') {
        return 'La commande /betray ne peut être utilisée que pendant la nuit, lors de la phase de pouvoirs spéciaux.';
    }

    const joueur = joueurs.find(j => j.phone === from && j.role === 'Loup Solitaire');
    if (!joueur) {
        return 'Seul le Loup Solitaire peut utiliser cette commande.';
    }

    // Vérification si c'est une nuit impaire
    if (sousPhase !== 'nuit' || (phase % 2 === 0)) {
        return 'Le Loup Solitaire ne peut trahir que pendant les nuits impaires.';
    }

    if (joueur.aTrahi) {
        return 'Vous avez déjà trahi cette nuit.';
    }

    // Trouver un autre loup-garou à trahir
    const victimePseudo = msg.split(' ')[1];
    const victime = joueurs.find(j => j.pseudo.toLowerCase() === victimePseudo.toLowerCase() && j.role === 'Loup-Garou' && !j.estMort);
    if (!victime) {
        return `Aucun loup-garou valide à trahir avec le pseudo ${victimePseudo}.`;
    }

    victime.estMort = true;
    joueur.aTrahi = true;
    return `Vous avez trahi et tué ${victime.pseudo} cette nuit.`;
}


function verifierConditionsVictoire(joueurs) {
    // Condition pour les villageois : Tous les loups doivent être éliminés
    const loupsRestants = joueurs.filter(j => j.role === 'Loup-Garou' && !j.estMort);
    if (loupsRestants.length === 0) {
        return '🎉 Les villageois ont gagné en éliminant tous les loups !';
    }

    // Condition pour le joueur de flûte : Il a charmé tout le monde
    const flute = joueurs.find(j => j.role === 'Joueur de Flûte');
    if (flute && flute.joueursEnvoutés.length === joueurs.length - 1) {
        return '🎉 Le joueur de flûte a charmé tout le monde et a gagné !';
    }

    // Condition pour le loup solitaire : Tous les joueurs sont morts
    const joueursRestants = joueurs.filter(j => !j.estMort);
    if (joueursRestants.length === 1 && joueursRestants[0].role === 'Loup Solitaire') {
        return '🎉 Le Loup Solitaire a gagné en tuant tout le monde !';
    }

    // Condition pour le parieur : Vérification de son score
    const parieur = joueurs.find(j => j.role === 'Parieur');
    if (parieur && parieur.pointsParieur >= 3) {
        return '🎉 Le Parieur a gagné en accumulant 3 points !';
    }

    // Condition pour les amoureux : Vérifier si seuls les amoureux sont en vie
    const amoureuxRestants = joueurs.filter(j => j.role === 'Amoureux' && !j.estMort);
    if (amoureuxRestants.length === 2 && joueursRestants.length === 2) {
        return '🎉 Les amoureux ont gagné en restant les derniers survivants !';
    }

    // Aucun gagnant détecté
    return null;
}


function determinerVictimeNuit() {
    const { joueurs, nightVotes } = getGameState();
    const votes = Object.values(nightVotes).filter(v => typeof v === 'string');
    const voteCounts = votes.reduce((acc, vote) => {
        acc[vote] = (acc[vote] || 0) + 1;
        return acc;
    }, {});

    const [victimePhone, totalVotes] = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0] || [];
    const victime = joueurs.find(j => j.phone === victimePhone);
    if (!victime) return '😴 Personne n\'a été tué cette nuit.';

    const chevalierPhone = nightVotes['chevalier'];
    const sorciereSauve = nightVotes['sorciere_vie'];

    if (victime.phone === chevalierPhone) return '🛡️ Grâce au Chevalier, personne n\'a été tué cette nuit.';
    if (sorciereSauve) return '💚 La Sorcière a sauvé la victime. Personne n\'est mort cette nuit.';

    if (victime.role === "L'Ancien") {
        if (!victime.aSurvecuUneFois) {
            victime.aSurvecuUneFois = true;
            return `🛡️ La victime a survécu !`;
        }
    }

    victime.estMort = true;
    let message = `💀 Cette nuit, ${victime.pseudo} a été tué(e) avec ${totalVotes} voix contre lui.`;

    // Gestion du Parieur
    joueurs.forEach(joueur => {
        if (joueur.role === 'Parieur' && joueur.pari) {
            if (joueur.pari === victime.pseudo) {
                joueur.pointsParieur = (joueur.pointsParieur || 0) + 1;
                message += `\n🎯 Le Parieur a correctement parié que ${victime.pseudo} serait la victime et gagne un point !`;
            } else {
                joueur.erreursParieur = (joueur.erreursParieur || 0) + 1;
                message += `\n❌ Le Parieur a échoué dans son pari.`;
            }

            if (joueur.pointsParieur >= 3) {
                joueursGagnants.push(joueur);
                message += `\n🏆 Le Parieur a gagné la partie avec 3 points !`;
            }

            if (joueur.erreursParieur >= 3) {
                joueur.estMort = true;
                message += `\n☠️ Le Parieur a fait 3 erreurs et est éliminé !`;
            }

            // Réinitialiser les paris pour le tour suivant
            joueur.pari = null;
            joueur.aParie = false;
        }
    });

    // Vérification des conditions de victoire
    const victoireMessage = verifierConditionsVictoire(joueurs);
    if (victoireMessage) {
        message += `\n${victoireMessage}`;
    }

    return message;
}


  
  function determinerVictimeJour() {
    const { joueurs, jourVotes } = getGameState();
    const votes = Object.values(jourVotes);
    const voteCounts = votes.reduce((acc, vote) => {
      acc[vote] = (acc[vote] || 0) + 1;
      return acc;
    }, {});
    const [victimePhone, totalVotes] = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0] || [];
    const victime = joueurs.find(j => j.phone === victimePhone);
    if (!victime) return '😐 Aucun joueur n\'a été éliminé.';
  
    if (victime.role === "L'Ancien") {
      if (!victime.aSurvecuUneFois) {
        victime.aSurvecuUneFois = true;
        return `🛡️ ${victime.pseudo}, l'Ancien, a résisté à sa première élimination !`;
      }
    }
  
    victime.estMort = true;
    return `🗳️ ${victime.pseudo} a été éliminé avec ${totalVotes} voix.`;
  }
  


// Fonction pour gérer la fin de la phase de nuit
function endNightPhase() {
    // Appel à la fonction de détermination de la victime
    const victimeMessage = determinerVictimeNuit();

    // Changer la phase en "jour"
    phase = 'jour';
    sousPhase = ''; // Réinitialisation de la sous-phase

    // Retourner le message de fin de nuit
    return `${victimeMessage}\nLa phase de nuit est terminée. La phase de jour commence maintenant.`;
}



// Mise à jour du switch avec la commande
function handleCommand(msg, from) {
    let réponse = '';

    switch (msg) {
        case '/changerPhase':
            réponse = handleChangerPhaseCommand(from, msg);
            break;
        case '/start':
            réponse = handleStartCommand(from, joueurs);
            break;
        case '/participate':
            réponse = handleParticipateCommand(from);
            break;
        case '/roles':
            réponse = handleRolesCommand();
            break;
        case '/kill':
            réponse = handleKillCommand(from, msg);
            break;
        case '/see':
            réponse = handleSeeCommand(from, msg);
            break;
        case '/heal':
            réponse = handleHealCommand(from, msg);
            break;
        case '/poison':
            réponse = handlePoisonCommand(from, msg);
            break;
        case '/love':
            réponse = handleLoveCommand(from, msg);
            break;
        case '/guard':
            réponse = handleGuardCommand(from, msg);
            break;
        case '/shoot':
            réponse = handleShootCommand(from, msg);
            break;
        case '/charm':
            réponse = handleCharmCommand(from, msg);
            break;
        case '/parier':
            réponse = handleParierCommand(from, msg);
            break;
        case '/betray':
            réponse = handleBetrayCommand(from, msg);
            break;                                
        case '/endnight':
            réponse = endNightPhase();
            break;
        default:
            réponse = 'Commande inconnue. Essayez : /start, /participate, /roles, /kill, /see, /heal, /poison, /endnight.';
    }

    return réponse;
}

// Export des commandes
module.exports = {
    handleChangerPhaseCommand,
    handleStartCommand,
    handleParticipateCommand,
    handleRolesCommand,
    handleKillCommand,
    handleSeeCommand,
    handleHealCommand,
    handlePoisonCommand,
    handleLoveCommand,
    handleGuardCommand,
    handleShootCommand,
    handleCharmCommand,
    handleParierCommand,
    handleBetrayCommand,
    endNightPhase,
    handleCommand,
    determinerVictimeJour,
    verifierConditionsVictoire,
    determinerVictimeNuit
};
