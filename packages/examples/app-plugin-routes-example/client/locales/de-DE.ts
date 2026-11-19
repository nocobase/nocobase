import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  providerDescription:
    'Diese Seite verwendet einen Anbieter, der vom selben Client-Plugin bereitgestellt wird.',
  loadError: 'Die Serverroute konnte nicht geladen werden.',
  clientExample: 'Beispiel für eine Client-Route',
  title: 'Beispiel für Routen',
  pageDescription:
    'Es wurde verzögert geladen und liest eine Antwort von der Serverroute desselben Plugins.',
  loading: 'Serverdaten werden geladen…',
  retry: 'Anfrage erneut senden',
  plugin: 'Plugin',
  scope: 'Geltungsbereich',
  message: 'Nachricht',
  settingsTitle: 'Einstellungen des Routenbeispiels',
  settingsDescription:
    'Vom Routenbeispiel-Plugin mit defineSettingsRoutes() deklariert.',
  settingsBody:
    'Diese Einstellungsseite stammt aus einem Plugin. Sie wird mit defineSettingsRoutes() deklariert, gehört zur Kategorie „System“ und liegt unter /settings.',
};

export default deDE;
