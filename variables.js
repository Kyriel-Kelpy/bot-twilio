// variables.js

const pseudos = [
  "ÉtoileNoire", "OmbreFurtive", "LynxVif", "FeuSacré", "Fantomatique", "GrosseTête", "FlammeD'or",
  "BriseMatinale", "SerpentGris", "MasqueVaudou", "LuneArgentée", "SombreTempête", "SirèneArgentée", 
  "VigilantNuit", "PommeD'or", "PerleSauvage", "SaphirMystère", "AubeEnflammée", "PoidsLégers", 
  "CoeurTénébreux", "RacineAmère", "WhiteWolf", "CielNocturne", "MajoraMask", "FleurBleue", "MementoMori", 
  "VentSolaire", "MerRouge", "DélugeTempête", "AigleRafale"
];

const roles = [
  "Villageois","Villageois","Villageois","Villageois","Villageois","Villageois","Villageois","Villageois","Villageois","Villageois","Villageois","Villageois","Villageois","Villageois","Villageois", // 15
  "Loup-Garou","Loup-Garou","Loup-Garou","Loup-Garou","Loup-Garou", "Loup-Garou","Loup Solitaire", // 7
  "Voyante", "Sorcière", "Cupidon", "Chasseur", "Joueur de Flûte", "Le Maire", "Le Chevalier", "Parieur" // 8
];

const rolesData = [
  {
    nom: "Villageois",
    description: "Simple habitant du village, vous ne disposez d'aucun pouvoir spécial.",
    commandes: [],
    utilisation: "aucune",
    moment: "jamais"
  },
  {
    nom: "Loup-Garou",
    description: "Chaque nuit, vous vous réveillez avec les autres loups pour choisir une victime.",
    commandes: ["/kill"],
    utilisation: "1 fois par nuit",
    moment: "nuit"
  },
  {
    nom: "Voyante",
    description: "Chaque nuit, vous pouvez découvrir le rôle d’un joueur.",
    commandes: ["/see"],
    utilisation: "1 fois par nuit",
    moment: "nuit"
  },
  {
    nom: "Sorcière",
    description: "Vous possédez deux potions : une pour sauver une victime, et une pour en tuer un joueur. Chaque potion s’utilise une seule fois.",
    commandes: ["/heal", "/poison"],
    utilisation: "1 fois par commande",
    moment: "nuit"
  },
  {
    nom: "Chasseur",
    description: "Si vous mourrez (vote ou nuit), vous pouvez immédiatement tirer sur un joueur de votre choix.",
    commandes: ["/shoot"],
    utilisation: "1 fois, à votre mort",
    moment: "immédiat à la mort"
  },
  {
    nom: "Cupidon",
    description: "Au début de la partie, vous désignez deux amoureux. Si l’un meurt, l’autre meurt aussi.",
    commandes: ["/love"],
    utilisation: "1 fois",
    moment: "nuit 0"
  },
  {
    nom: "Parieur",
    description: "Chaque nuit, vous pariez sur la cible des loups. Si vous devinez juste, vous gagnez un point. À 3 points, vous gagnez seul. Mais si vous ratez trois fois, vous mourez.",
    commandes: ["/parier"],
    utilisation: "1 pari par nuit",
    moment: "nuit, après que les loups ont choisi leur cible"

  },
  {
    nom: "Joueur de Flûte",
    description: "Chaque nuit, vous pouvez envoûter deux joueurs. S’ils sont tous envoûtés, vous gagnez seul.",
    commandes: ["/charm"],
    utilisation: "2 fois par nuit",
    moment: "nuit"
  },
  {
    nom: "Le Maire",
    description: "Votre vote compte double lors des votes de jour.",
    commandes: [],
    utilisation: "passif",
    moment: "jour (vote)"
  },
 
  {
    nom: "Chevalier",
    description: "Chaque nuit, vous protégez un joueur des attaques. Vous ne pouvez pas protéger la même personne deux nuits de suite.",
    commandes: ["/guard"],
    utilisation: "1 fois par nuit, sauf répétition",
    moment: "nuit"
  },

  {
    nom: "Loup Solitaire",
    description: "Les nuits impaires, vous pouvez trahir et dévorer un autre loup-garou. S’ils tout le monde sans exception meurt, vous gagnez seul.",
    commandes: ["/betray"],
    utilisation: "1 fois par nuit, les nuit impaires",
    moment: "nuit"
  }
];


// Variables de jeu (états)
let joueurs = [];
let phase = 'jour';
let votes = [];

// Export
module.exports = {
  pseudos,
  roles,
  joueurs,
  phase,
  votes
};
