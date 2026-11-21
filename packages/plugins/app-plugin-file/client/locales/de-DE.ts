import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  storage: {
    title: 'Dateispeicher',
    navDescription:
      'Wo hochgeladene Dateien gespeichert werden und welche Funktionen Dateien speichern',
    description:
      'Wo hochgeladene Dateien gespeichert werden, wie groß eine Datei sein darf und welche Funktionen Dateien speichern. Der Speicher wird in der Anwendungskonfiguration (`drive`) festgelegt und wirkt nach einem erneuten Deployment; diese Seite zeigt die wirksamen Einstellungen und prüft, ob der Speicher tatsächlich gelesen und beschrieben werden kann.',
    checkAction: 'Speicher prüfen',
    loading: 'Dateispeicher wird geladen…',
    loadFailed: 'Der Dateispeicher konnte nicht geladen werden.',
    retry: 'Erneut versuchen',
    tabs: { disks: 'Speicher', usages: 'Funktionen' },
    hints: {
      title_one: '{{count}} Hinweis',
      title_other: '{{count}} Hinweise',
      incomplete:
        'Datenträger {{disk}} ist nicht vollständig konfiguriert ({{problems}}): Solange er nicht verwendet wird, schadet das nicht; wird er gewählt, schlägt es fehl.',
      localDefault:
        'Der Standardspeicher ist ein lokaler Datenträger: Die Anwendung kann nur als einzelne Instanz laufen. Verwenden Sie für mehrere Instanzen einen gemeinsamen Speicher.',
      seeCluster: 'Siehe Cluster und verteilter Betrieb.',
    },
    columns: {
      name: 'Name',
      type: 'Typ · Ort',
      visibility: 'Sichtbarkeit',
      maxFileSize: 'Max. Dateigröße',
      usages: 'Funktionen',
      status: 'Status',
      feature: 'Funktion',
      collection: 'Dateitabelle',
      disk: 'Gespeichert auf',
      download: 'Download',
      files: 'Dateien',
      setting: 'Einstellung',
      value: 'Aktueller Wert',
      source: 'Quelle',
    },
    default: 'Standard',
    details: 'Details',
    usageCount_one: '{{count}} Funktion',
    usageCount_other: '{{count}} Funktionen',
    drivers: {
      fs: 'Lokaler Datenträger',
      s3: 'S3-kompatibler Speicher',
      oss: 'Alibaba Cloud OSS',
      custom: 'Benutzerdefinierter Treiber',
    },
    location: {
      inApp: '{{path}} (im Anwendungsverzeichnis)',
      outsideApp: 'Außerhalb des Anwendungsverzeichnisses',
      bucketMissing: 'bucket nicht festgelegt',
      unknown: 'Im Code festgelegt',
    },
    visibility: {
      private: 'Privat',
      public: 'Öffentlich',
      privateLong: 'Privat: nur über die Anwendung herunterladbar',
      publicLong: 'Öffentlich: Jeder mit der URL kann herunterladen',
      unknown: 'Vom Treiber bestimmt',
    },
    urls: {
      application: 'Von der Anwendung ausgeliefert (stream)',
      public: 'Öffentliche URL',
      signed: 'Signierte URL mit Ablaufzeit',
    },
    sizeMb: '{{size}} MB',
    status: {
      ok: 'Lesen und Schreiben OK',
      failed: 'Prüfung fehlgeschlagen',
      incomplete: 'Nicht vollständig konfiguriert',
      unchecked: 'Nicht geprüft',
      checkedAgo: 'Geprüft {{time}}',
    },
    problems: {
      LOCATION_MISSING: 'location ist leer',
      BUCKET_MISSING: 'bucket ist leer',
      REGION_MISSING: 'region ist leer',
      CREDENTIALS_MISSING: 'Zugangsdaten fehlen',
      NOT_LOADED: 'von der Anwendung nicht geladen',
    },
    sources: { code: 'Code', config: 'Konfiguration', default: 'Standardwert' },
    settings: {
      driver: 'Typ',
      location: 'Ort',
      visibility: 'Sichtbarkeit',
      maxFileSize: 'Max. Dateigröße',
      urls: 'Download-Links',
    },
    backToList: 'Dateispeicher',
    defaultSubtitle: 'Neue Uploads werden standardmäßig hier gespeichert.',
    notDefaultSubtitle:
      'Wird nur von den Funktionen verwendet, die ihn angeben.',
    notFound: 'Datenträger {{disk}} ist nicht konfiguriert.',
    howToChange: 'So ändern Sie es',
    howToChangeNote:
      'Alibaba Cloud OSS (`oss`) und benutzerdefinierte Treiber werden ebenfalls unterstützt. Deployen Sie nach der Änderung erneut und erhöhen Sie das Limit für den Anfragekörper des Reverse-Proxys mindestens auf die max. Dateigröße.',
    check: {
      title: 'Prüfung',
      run: 'Prüfen',
      rerun: 'Erneut prüfen',
      running: 'Wird geprüft…',
      failed: 'Die Prüfung konnte nicht ausgeführt werden.',
      never:
        'Dieser Datenträger wurde auf dieser Instanz seit ihrem Start noch nicht geprüft.',
      scope:
        'Es wird nur eine temporäre Datei im Verzeichnis `nocobase-check/` des Datenträgers geschrieben, gelesen und gelöscht; Geschäftsdateien werden nicht berührt. Bei mehreren Instanzen wird nur diese Instanz geprüft.',
      steps: {
        write: 'Temporäre Datei schreiben',
        read: 'Zurücklesen und vergleichen',
        url: 'Download-Link erstellen',
        delete: 'Temporäre Datei löschen',
      },
      details: {
        bytes: '{{bytes}} Bytes stimmen überein',
        APPLICATION: 'Über die Anwendung ausgeliefert',
        PUBLIC: 'Öffentliche URL erstellt',
        SIGNED: 'Signierte URL erstellt',
        deleted: 'Gelöscht',
        skipped: 'Übersprungen',
      },
      reasons: {
        CONFIG_INCOMPLETE: 'Konfiguration unvollständig: {{detail}}',
        DISK_UNAVAILABLE: 'Der Datenträger konnte nicht geöffnet werden',
        WRITE_FAILED: 'Schreiben fehlgeschlagen',
        READ_FAILED: 'Lesen fehlgeschlagen',
        CONTENT_MISMATCH: 'Der zurückgelesene Inhalt weicht ab',
        URL_FAILED: 'Es konnte kein Link erstellt werden',
        DELETE_FAILED: 'Löschen fehlgeschlagen',
        unknown: 'Fehlgeschlagen',
      },
    },
    usedBy: 'Funktionen, die diesen Datenträger verwenden',
    noUsagesOnDisk: 'Keine Funktion speichert Dateien auf diesem Datenträger.',
    download: {
      authenticated: 'Anmeldung und Berechtigung',
      public: 'Öffentlicher Link',
    },
    diskDefault: 'Standard ({{disk}})',
    diskConfig: '{{path}} → {{disk}}',
    diskConfigDefault: '{{path}} → Standard ({{disk}})',
    plugin: 'Plugin {{plugin}}',
    application: 'Anwendung',
    filesValue: '{{files}} Dateien · {{size}}',
    filesUnavailable: 'Konnte nicht gezählt werden',
    empty: {
      title: 'Noch keine Funktion speichert Dateien',
      description:
        'Dateitabellen werden von Plugins oder vom Anwendungscode angelegt. Sobald ein Plugin mit Anhängen installiert ist (etwa Projekte, Wissensdatenbanken oder Agenten), erscheint es hier ohne weitere Einrichtung.',
      defaultDisk:
        'Die Speichereinstellungen gelten weiterhin: Später hinzugefügte Dateitabellen speichern Dateien standardmäßig auf {{disk}}.',
    },
    notes: {
      title: 'Hinweise',
      firstUse:
        'Der Speicher wird erst bei der ersten Verwendung verbunden, ein erfolgreicher Start beweist also nicht, dass er gelesen und beschrieben werden kann. Die Prüfung schreibt, liest und löscht eine temporäre Datei, um das zu bestätigen.',
      changeDefault:
        'Eine Änderung des Standardspeichers betrifft nur spätere Uploads; vorhandene Dateien werden weiterhin aus dem Speicher gelesen, den ihre Datensätze angeben, und nicht verschoben.',
      deleteRecords:
        'Das Löschen eines Datensatzes löscht seine Datei nicht vom Datenträger.',
      publicLinks:
        'Ein öffentlicher Link kann von jedem geöffnet werden, der ihn kennt, ohne Anmeldung. Sensible Dateien sollten über die eigenen authentifizierten Routen des Plugins ausgeliefert werden.',
      noBrowser:
        'Es gibt keinen globalen Dateibrowser: Dateien gehören zu ihren Funktionen und werden mit den Berechtigungen der jeweiligen Funktion angezeigt.',
      readOnly:
        'Funktionen werden vom Plugin- oder Anwendungscode deklariert (Dateitabelle, Datenträger, Download-Methode). Diese Liste ist schreibgeschützt; hier können keine Dateitabellen angelegt werden.',
    },
  },
  'files.ooxmlLoadFailed':
    'Diese Office Open XML-Datei kann nicht gerendert werden.',
  'files.ooxmlLoadTimedOut':
    'Die Vorschau wurde nicht innerhalb von {{minutes}} Minuten vollständig geladen.',
  'files.previewRequestFailed':
    'Vorschauanforderung fehlgeschlagen ({{status}}).',
  uploadFailed: 'Datei-Upload fehlgeschlagen.',
  fileLimitReached: 'Die maximale Anzahl an Dateien wurde erreicht.',
  fileTooLarge: 'Datei überschreitet die maximale Größe.',
  fileTypeNotAllowed: 'Dateityp ist nicht zulässig.',
  removalFailed: 'Das Entfernen der Datei ist fehlgeschlagen.',
  urlNotAllowed: 'Datei URL ist nicht zulässig.',
  downloadFailed: 'Datei-Download fehlgeschlagen.',
  invalidUrl: 'Datei URL fehlt oder ist nicht zulässig.',
  pdfPreviewFailed: 'Die PDF-Vorschau kann nicht geladen werden.',
  pdfPreviewMarkup: 'Die Datei URL gab HTML oder XML statt einer PDF zurück.',
  previewFailed: 'Die Dateivorschau konnte nicht geladen werden.',
  'files.empty': 'Keine Akten.',
  'files.preview': 'Vorschau',
  'files.download': 'Herunterladen',
  'files.remove': 'Entfernen',
  'files.chooseMany': 'Dateien auswählen',
  'files.chooseOne': 'Datei auswählen',
  'files.retry': 'Erneut versuchen',
  'files.done': 'Erledigt',
  'files.uploading': 'Hochladen',
  'files.failed': 'Fehlgeschlagen',
  'files.pending': 'Ausstehend',
  'files.previous': 'Vorherige Datei',
  'files.next': 'Nächste Datei',
  'files.loadingPreview': 'Vorschau wird geladen...',
  'files.downloadFile': 'Datei herunterladen',
  'files.previewUnavailable':
    'Die Vorschau ist für diesen Dateityp nicht verfügbar.',
  'files.imageFailed':
    'Dieses Bild konnte nicht angezeigt werden. Möglicherweise ist es beschädigt oder liegt in einem nicht unterstützten Format vor.',
  'files.officeFailed': 'Office Online konnte diese Datei nicht laden.',
  'files.officeUrl':
    'Office Online erfordert eine über das Internet zugängliche absolute Datei URL.',
  'files.cancelFile': 'Abbrechen {{filename}}',
  'files.status.uploading': 'Hochladen',
  'files.status.pending': 'Ausstehend',
  'files.status.error': 'Fehlgeschlagen',
};

export default deDE;
