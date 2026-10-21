import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Demodaten',
    read: 'Anzeigen',
    manage: 'Erzeugen und löschen',
    configuration: 'Demokonfiguration',
    configure: 'Konfigurieren',
  },
  accounts: {
    title: 'Demo-Konten',
    description:
      'Öffnen Sie die Demo mit einem dieser Konten, um zu sehen, was jedes davon sieht.',
    enter: 'Öffnen',
    signedInAs: 'Angemeldet als {{name}} · Wechseln',
    current: 'Aktuell',
    entering: 'Wird geöffnet…',
    failed: 'Dieses Demo-Konto konnte nicht geöffnet werden.',
    unavailable: 'Derzeit sind keine Demo-Konten verfügbar.',
    password: 'Mit Passwort anmelden',
  },
  refused: {
    title: 'Dies ist eine Demo. Änderungen können nicht gespeichert werden.',
    description: 'Alle anderen Funktionen sind wie gewohnt verfügbar.',
  },
};
export default resource;
