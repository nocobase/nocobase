import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const frFR: LocaleResource<typeof enUS> = {
  providerDescription:
    'Cette page utilise un fournisseur fourni par le même plugin client.',
  loadError: 'Impossible de charger la route du serveur.',
  clientExample: 'Exemple de route client',
  title: "Exemple d'itinéraires",
  pageDescription:
    'Il a été chargé paresseux et lit une réponse depuis la route du serveur du même plugin.',
  loading: 'Chargement des données du serveur…',
  retry: 'Réessayer la requête',
  plugin: 'Plugin',
  scope: 'Périmètre',
  message: 'Message',
  settingsTitle: 'Paramètres de l’exemple de routes',
  settingsDescription:
    'Déclaré par le plugin d’exemple de routes avec defineSettingsRoutes().',
  settingsBody:
    'Cette page de paramètres provient d’un plugin. Elle est déclarée avec defineSettingsRoutes(), rejoint la catégorie Système et est montée sous /settings.',
};

export default frFR;
