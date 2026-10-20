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
};

export default deDE;
