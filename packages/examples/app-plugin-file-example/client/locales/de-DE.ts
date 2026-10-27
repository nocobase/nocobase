import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  retrySubmission: 'Ursprünglichen Vorgang erneut versuchen',

  officePreviewTitle: 'Vorschau des lokalen Büros',
  officePreviewDescription:
    'Laden Sie unten eine DOCX-, XLSX- oder PPTX-Datei hoch und wählen Sie dann Vorschau aus. Dokumente werden in Ihrem Browser ohne Office Online oder einen externen Vorschaudienst gerendert. Bestellanhänge verwenden dieselbe Vorschau.',
  officePreviewLimits:
    'Es ist keine Internetverbindung erforderlich, wenn die App und der Dateidienst in Ihrem lokalen Netzwerk erreichbar sind. Dies ist kein vollständig getrennter Modus. Ältere DOC-, XLS-, PPT- und OpenDocument-Dateien können in diesem Beispiel weiterhin nur heruntergeladen werden.',
  title: 'Anhänge',
  description:
    'Laden Sie eine oder mehrere Dateien hoch und zeigen Sie sie direkt in der Vorschau an. Datensätze werden über das Datei-Repository API gespeichert.',
  apiHint:
    'Diese Seite behält den Roh-Repository-Fluss bei: Die Upload-Steuerung ruft uploadOne für eine einzelne Datei und uploadMany für einen Stapel auf.',
  retention:
    'Durch das Löschen eines Datensatzes werden nur seine Metadaten entfernt; Das gespeicherte Objekt bleibt auf der Festplatte.',
  choose: 'Dateien auswählen',
  uploading: 'Hochladen…',
  dropHint: 'oder Dateien hier ablegen',
  tooLarge: 'Datei überschreitet die maximale Größe',
  rejected: 'Dateityp ist nicht zulässig',
  uploadFailed: 'Hochladen fehlgeschlagen',
  preview: 'Vorschau',
  download: 'Herunterladen',
  remove: 'Löschen',
  unlink: 'Aus der Bestellung entfernen',
  empty: 'Noch keine Dateien.',
  close: 'Schließen',
  previous: 'Zurück',
  next: 'Weiter',
  loading: 'Wird geladen…',
  previewUnsupported:
    'Dieser Dateityp verfügt über keine Inline-Vorschau. Laden Sie es stattdessen herunter.',
  previewFailed: 'Die Datei konnte nicht geladen werden.',
  navGroup: 'Dateibeispiel',
  navAttachments: 'Anhänge',
  navProfiles: 'Profil-Avatare',
  navOrders: 'Bestellanhänge',
  profilesTitle: 'Profil-Avatare (eins zu eins)',
  profilesDescription:
    'Ein Profil hat höchstens einen Avatar. Durch das Hochladen eines neuen Avatars wird die vorherige Datei ersetzt.',
  profilesRelationHint:
    'Beziehung: fileExampleProfiles.avatar ist eine hasOne-Beziehung zu fileExampleProfileAvatars, die eine eindeutige Profil-ID behält.',
  noAvatar: 'Kein Avatar',
  profilesNoFile: 'Keine Avatardatei verbunden',
  profilesEmpty:
    'Keine Profile gefunden. Führen Sie den Beispiel-Seed aus, um Demodatensätze zu erstellen.',
  uploadAvatar: 'Avatar hochladen',
  replaceAvatar: 'Avatar ersetzen',
  removeAvatar: 'Avatar entfernen',
  avatarHint:
    'Beim Hochladen wird die Datei gespeichert und dann über die Profilbeziehung verbunden. Durch das Entfernen wird nur die Beziehung gelöscht.',
  ordersTitle: 'Auftragsanhänge (eins-zu-viele)',
  ordersDescription:
    'Zu einem Auftrag gehören beliebig viele Anhänge. Wählen Sie mehrere Dateien gleichzeitig aus, um sie als Stapel hochzuladen.',
  ordersRelationHint:
    'Beziehung: fileExampleOrders.attachments ist eine hasMany-Beziehung zu fileExampleOrderAttachments über orderId.',
  ordersNoFiles: 'Keine Anhänge zu dieser Bestellung.',
  ordersEmpty:
    'Keine Bestellungen gefunden. Führen Sie den Beispiel-Seed aus, um Demodatensätze zu erstellen.',
  ordersHint:
    'Durch das Entfernen eines Anhangs wird die Bestellbeziehung gelöscht. Der Dateidatensatz bleibt im Datei-Repository verfügbar.',
  'status.draft': 'Entwurf',
  'status.submitted': 'Eingereicht',
  'status.archived': 'Archiviert',
};

export default deDE;
