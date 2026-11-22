import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  nav: {
    plugins: 'Plugins',
    pluginsDescription:
      'Welche Plugins diese Anwendung nutzt, in welcher Version, und wie man die übrigen aktiviert.',
  },
  access: {
    section: 'System',
    settings: {
      plugins: 'Plugins',
    },
    actions: {
      read: 'Anzeigen',
    },
  },
  page: {
    title: 'Plugins',
    description:
      'Welche Plugins diese Anwendung nutzt. Ein Plugin zu aktivieren oder zu deaktivieren ändert den Code der Anwendung und wirkt erst nach einem Neustart, deshalb zeigt diese Seite die auszuführenden Befehle statt Schalter.',
    deployed:
      'Dies ist eine bereitgestellte Anwendung: Es werden nur die mit ihr bereitgestellten Plugins angezeigt. Plugins, die nur während der Entwicklung sichtbar sind, fehlen hier.',
    attention_one:
      '{{count}} Plugin braucht Aufmerksamkeit und steht ganz oben.',
    attention_other:
      '{{count}} Plugins brauchen Aufmerksamkeit und stehen ganz oben.',
    search: 'Nach Name oder Paket suchen',
    loading: 'Plugins werden geladen…',
    loadFailed: 'Die Plugins konnten nicht geladen werden.',
    retry: 'Erneut versuchen',
    empty: 'Kein Plugin passt.',
  },
  filters: {
    label: 'Anzeigen',
    all: 'Alle {{count}}',
    enabled: 'Aktiviert {{count}}',
    disabled: 'Nicht aktiviert {{count}}',
    attention: 'Braucht Aufmerksamkeit {{count}}',
  },
  columns: {
    plugin: 'Plugin',
    version: 'Version',
    status: 'Status',
    actions: 'Aktionen',
  },
  groups: {
    enabled: 'Aktiviert {{count}}',
    disabled: 'Nicht aktiviert {{count}}',
  },
  status: {
    enabled: 'Aktiviert',
    skillsOnly: 'Aktiviert · Nur Skills',
    enabledAttention: 'Aktiviert · Braucht Aufmerksamkeit',
    disabled: 'Nicht aktiviert',
    preinstalled: 'Nicht aktiviert · Nur in der Entwicklung',
    disabledAttention: 'Nicht aktiviert · Braucht Aufmerksamkeit',
    unknown: 'Unbekannt · Neu bauen',
  },
  reasons: {
    partial:
      'Nur teilweise aktiviert: Die Seiten öffnen sich, aber ihre Daten werden nicht geladen. Führen Sie den Aktivierungsbefehl erneut aus, um das zu beheben.',
    devDependency:
      'Aktiviert, wird aber beim Bereitstellen der Anwendung nicht mitgenommen, sodass es in der Live-Anwendung fehlt. Führen Sie den Aktivierungsbefehl erneut aus, um das zu beheben.',
    missingRequires: '„{{title}}“ benötigt {{names}}, das nicht aktiviert ist.',
    other:
      'In dieser Anwendung nicht vollständig eingerichtet. Führen Sie den Aktivierungsbefehl erneut aus, um das zu beheben.',
    requiresFirst:
      'Zuerst aktivieren: {{names}} (im Aktivierungsbefehl enthalten)',
    unknown:
      'Diese Anwendung wurde gebaut, bevor der Build festhielt, welche Kommandozeilen-Plugins sie registriert. Ob dieses aktiviert ist, lässt sich hier nicht feststellen. Führen Sie pnpm build erneut aus und stellen Sie neu bereit.',
  },
  actions: {
    commands: 'Befehle',
    commandsFor: 'Befehle für {{title}}',
    enable: 'So aktivieren',
    enableFor: 'So aktivieren Sie {{title}}',
  },
  commands: {
    title: 'Befehle für {{title}}',
    description:
      'Im Code-Verzeichnis der Anwendung ausführen und sie danach neu starten; für die Live-Anwendung neu bauen und bereitstellen.',
    fix: 'Behebt, was Aufmerksamkeit braucht',
    update: 'Aktualisiert auf die neueste Version',
    unregister: 'Deaktiviert es; seine Daten bleiben erhalten',
    dependents:
      'Aktivierte Plugins, die davon abhängen: {{names}}. Deaktivieren Sie sie zusammen damit.',
    noDependents:
      'Kein aktiviertes Plugin hängt davon ab, es kann also allein deaktiviert werden.',
    optionalDependents:
      'Aktivierte Plugins, die es optional nutzen: {{names}}. Sie funktionieren weiter ohne es, verlieren aber die Funktionen, die es brauchen.',
  },
  enable: {
    title: '{{title}} aktivieren',
    description: 'Im Code-Verzeichnis der Anwendung ausführen:',
    requires:
      '{{title}} hängt von {{names}} ab, das ebenfalls noch nicht aktiviert ist; der Befehl enthält es.',
    development:
      'Lokale Entwicklung: Starten Sie danach pnpm dev neu und laden Sie diese Seite neu, um es aktiviert zu sehen.',
    live: 'Live-Anwendung: Änderung committen, pnpm build --tar ausführen und mit dem Installer aktualisieren.',
    data: 'Beim ersten Start werden seine Tabellen angelegt. Wird es später mit plugin unregister deaktiviert, bleiben seine Daten erhalten.',
  },
  dialog: {
    copy: 'Befehl kopieren',
    copied: 'Kopiert',
    copyFailed:
      'Kopieren fehlgeschlagen; markieren Sie den Befehl und kopieren Sie ihn.',
    close: 'Verstanden',
  },
};

export default deDE;
