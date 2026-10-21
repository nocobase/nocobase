import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Données de démonstration',
    read: 'Afficher',
    manage: 'Générer et effacer',
    configuration: 'Configuration de démonstration',
    configure: 'Configurer',
  },
  accounts: {
    title: 'Comptes de démonstration',
    description:
      'Entrez dans la démo avec l’un de ces comptes pour voir ce que voit chacun.',
    enter: 'Entrer',
    signedInAs: 'Connecté en tant que {{name}} · Changer',
    current: 'Actuel',
    entering: 'Connexion…',
    failed: 'Impossible d’entrer avec ce compte de démonstration.',
    unavailable:
      'Aucun compte de démonstration n’est disponible pour le moment.',
    password: 'Se connecter avec un mot de passe',
  },
  refused: {
    title:
      'Ceci est une démonstration. Les modifications ne peuvent pas être enregistrées.',
    description: 'Le reste fonctionne normalement.',
  },
};
export default resource;
