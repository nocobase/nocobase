import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  errors: {
    promptNotFound:
      'In der Sitzung ist keine Nachricht mit dieser Identität vorhanden.',
    promptStarted:
      'Die Verarbeitung der Nachricht hat begonnen und kann nicht zurückgezogen werden.',
    withdrawalUnsupported:
      'Diese ältere Nachricht kann nicht sicher zurückgezogen werden. Aktualisieren Sie die Befehlszeile und starten Sie die Computerverbindung neu.',
    bridgeReplaced:
      'Eine andere Bridge hat diesen Computer registriert. Starten Sie diese Verbindung neu.',
    submissionConflict:
      'Diese Einreichungs-ID wird bereits für eine andere Anfrage verwendet.',
    authenticationRequired:
      'Melden Sie sich an, um Agentensitzungen zu nutzen.',
    computerNotFound:
      'Kein Computer mit dieser ID ist mit Ihrem Konto verbunden.',
    sessionNotFound: 'Keine Sitzung mit dieser ID gehört Ihnen.',
    computerOffline:
      'Der Computer ist offline. Starten Sie die Bridge darauf und versuchen Sie es dann erneut.',
    agentUnavailable: 'Der Computer kann diesen Agenten nicht ausführen.',
    directoryNotAllowed:
      'Sitzungen auf diesem Computer funktionieren nur unter den Verzeichnissen, die seine Bridge zulässt.',
    sessionArchived:
      'Die Sitzung wird archiviert. Stellen Sie es zuerst wieder her.',
    permissionRequestNotFound:
      'Diese Berechtigungsanfrage wurde bereits beantwortet oder wartet nicht mehr.',
    choiceNotFound: 'Der Agent bietet diese Auswahl oder diesen Wert nicht an.',
    linkNotFound:
      'Nichts dergleichen mit dieser ID ist an die Sitzung gebunden, sonst kann ihre Arbeit nicht von hier aus beginnen.',
    invalidPageToken:
      'Das Seitentoken wurde von dieser Liste nicht ausgegeben.',
    upgradeRequired:
      'Die Bridge spricht eine andere Protokollversion. Aktualisieren Sie die Befehlszeile auf diesem Computer.',
    computerNotAnswering:
      'Der Computer hat nicht rechtzeitig geantwortet. Überprüfen Sie, ob die Verbindung aktiv ist, und versuchen Sie es dann erneut.',
    folderUnavailable:
      'Der Ordner kann auf dem Computer nicht geöffnet werden.',
    discoveryFailed:
      'Agent-Einstellungen konnten nicht geladen werden. Überprüfen Sie den Agenten auf diesem Computer und versuchen Sie es erneut.',
    projectNotFound:
      'Es gibt kein solches Projekt, oder Sie können es nicht sehen.',
    referenceNotFound:
      'Etwas Erwähntes existiert nicht oder Sie können es nicht sehen.',
    imageNotFound: 'In der Sitzung wurde kein Bild mit diesem Namen gesendet.',
    computerKeyInvalid:
      'Dieser Computer ist nicht mehr verbunden: Er wurde entfernt oder von einer anderen Stelle erneut verbunden. Führen Sie `acp start` darauf aus, um es erneut zu verbinden.',
  },
};

export default deDE;
