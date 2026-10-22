import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  navigation: {
    tasks: 'Benachrichtigungsbeispiele',
    taskManagement: 'Aufgaben',
    taskDetail: 'Aufgabendetails',
  },
  common: {
    close: 'Schließen',
    loading: 'Wird geladen…',
    saving: 'Speichern…',
  },
  fields: {
    title: 'Titel',
    description: 'Beschreibung',
    status: 'Status',
    assignee: 'Zugewiesene Person',
    creator: 'Schöpfer',
    chooseAssignee: 'Wählen Sie einen Benutzer',
  },
  status: {
    open: 'Öffnen',
    'in-progress': 'In Bearbeitung',
    done: 'Erledigt',
  },
  tasks: {
    title: 'Aufgaben',
    description:
      'Weisen Sie einem anderen Benutzer eine kleine Aufgabe zu. Der Beauftragte erhält eine In-App-Benachrichtigung mit der Aufgabenzusammenfassung und kann die Aufgabe auf der Detailseite bearbeiten. Verwenden Sie die Benachrichtigungsschaltfläche in der oberen Leiste, um Ihre Nachrichtenbenachrichtigungen zu öffnen.',
    listTitle: 'Alle Aufgaben',
    listDescription:
      'Alle Aufgaben, die Sie erstellt haben oder denen Sie zugewiesen wurden.',
    count: '{{count}}-Datensätze',
    empty: 'Noch keine Aufgaben.',
    assignee: 'Zugewiesen an',
    columns: {
      title: 'Titel',
      description: 'Beschreibung',
      status: 'Status',
      creator: 'Schöpfer',
      assignee: 'Zugewiesene Person',
      updatedAt: 'Letzte Aktualisierung',
      actions: 'Aktionen',
    },
    view: 'Details anzeigen',
    refresh: 'Aktualisieren',
    previous: 'Zurück',
    next: 'Weiter',
    page: 'Seite {{page}}',
    add: 'Neue Aufgabe',
    drawerTitle: 'Neue Aufgabe',
    drawerDescription:
      'Beim Erstellen einer Aufgabe werden deren grundlegende Informationen an den Beauftragten gesendet.',
    create: 'Aufgabe erstellen',
    cancel: 'Abbrechen',
  },
  taskDetail: {
    title: 'Aufgabendetails',
    summary: 'Aufgabendetails',
    createdAt: 'Erstellt',
    updatedAt: 'Letzte Aktualisierung',
    notificationHint:
      'Nachdem eine Aufgabe gespeichert wurde, werden die zugehörigen Personen außer dem aktuellen Bearbeiter benachrichtigt: der Ersteller und der aktuelle Beauftragte. Wenn sich der Beauftragte ändert, werden sowohl der bisherige als auch der neue Beauftragte benachrichtigt.',
    edit: 'Aufgabe bearbeiten',
    refresh: 'Aktualisieren',
    save: 'Änderungen speichern',
    cancel: 'Abbrechen',
    back: 'Zurück zu den Aufgaben',
  },
};

export default deDE;
