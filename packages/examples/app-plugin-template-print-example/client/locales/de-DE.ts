import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  navTitle: 'Beispiel für den Vorlagendruck',
  title: 'Beispiel für den Vorlagendruck',
  description:
    'Rendern Sie eine feste DOCX-Vorlage mit einer Rechnung und den zugehörigen autorisierten Angebotsdaten als DOCX oder PDF. Für die PDF-Konvertierung ist LibreOffice auf dem Anwendungsserver erforderlich.',
  invoiceList: 'Rechnungen',
  invoiceCount_one: '{{count}} Rechnung',
  invoiceCount_other: '{{count}} Rechnungen',
  loading: 'Rechnungen werden geladen…',
  empty: 'In Ihrem Angebotszugriffsbereich sind keine Rechnungen verfügbar.',
  emptyHint:
    'Führen Sie die Beispieldatenbankaufgaben aus und melden Sie sich als sales_manager an oder verwenden Sie ein Konto, das das verknüpfte Verkaufsangebot anzeigen kann.',
  loadFailed: 'Rechnungen konnten nicht geladen werden.',
  download: 'DOCX herunterladen',
  downloading: 'Rendern…',
  downloadFailed: 'Die Rechnung konnte nicht ausgestellt werden.',
  invoice: 'Rechnung',
  customer: 'Kunde',
  issuedOn: 'Ausgestellt am',
  quote: 'Quellenangabe',
  amount: 'Insgesamt',
  downloadActions: 'Aktionen herunterladen',
  downloadPdf: 'PDF herunterladen',
  pdfConverterUnavailable:
    'Die PDF-Konvertierung ist nicht verfügbar, da LibreOffice auf dem Anwendungsserver nicht gefunden wurde. Installieren Sie es auf demselben Computer oder Container wie NocoBase, stellen Sie sicher, dass der Serverprozess seine ausführbare Datei finden kann, und starten Sie die Anwendung neu. Der DOCX-Download bleibt verfügbar.',
  installLibreOffice: 'Laden Sie LibreOffice herunter',
  retry: 'Erneut versuchen',
};

export default deDE;
