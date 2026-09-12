# Übersicht der CRM-Sales-Cloud-Funktionen

In diesem Kapitel teilen wir das System nach Geschäftsfunktionen in mehrere Module auf und beschreiben die Kernfunktionen sowie die zugehörigen Datenstrukturen jedes Moduls. Die Lösung berücksichtigt nicht nur einen reibungslosen Geschäftsablauf, sondern auch die sinnvolle Datenspeicherung und Erweiterbarkeit.

---

## 1. Lead-Management

### Funktionsübersicht

Das Lead-Management-Modul erfasst und verwaltet Informationen potenzieller Kunden. Leads können über Webseite, Telefon, E-Mail und weitere Kanäle erfasst werden; Statusaktualisierung, Follow-up und Notizen werden unterstützt. Bei der Konvertierung erkennt das System automatisch Duplikate und überführt geeignete Leads in Kunden, Kontakte und Opportunities.

### Zugehörige Datentabellen

- **Leads (Lead-Tabelle)**
  Speichert grundlegende Lead-Informationen wie Name, Kontaktdaten, Quelle, aktueller Status und Notizen. Erstellungs- und Update-Logs werden für spätere Auswertungen erfasst.

---

## 2. Kunden- und Kontaktverwaltung

### Funktionsübersicht

Dieses Modul unterstützt den Aufbau und die Pflege von Kundendossiers. Unternehmen können Firmennamen, Branche, Adresse und weitere Schlüsselinformationen erfassen sowie zugehörige Kontaktdaten (Name, Position, Telefon, E-Mail) verwalten. Eins-zu-viele- und viele-zu-viele-Beziehungen zwischen Kunden und Kontakten werden unterstützt, um die Datenintegrität sicherzustellen.

### Zugehörige Datentabellen

- **Accounts (Kundentabelle)**
  Detaildossiers der Kunden mit grundlegenden Unternehmensinformationen und weiteren Geschäftsdaten.
- **Contacts (Kontakttabelle)**
  Persönliche Daten zu Kunden, über Fremdschlüssel mit der Kundentabelle verbunden, um Datenkonsistenz sicherzustellen.

### Konvertierungsdiagramm

![20250225211802](https://static-docs.nocobase.com/20250225211802.png)

- Lead erfassen → Lead-Follow-up (Statusaktualisierung) → Lead-Validierung → Konvertierung in Kunde, Kontakt und Opportunity

---

## 3. Opportunity-Management

### Funktionsübersicht

Das Opportunity-Management-Modul konzentriert sich darauf, aus konvertierten Leads oder bestehenden Kunden Verkaufschancen zu erzeugen. Erfasst werden erwartetes Abschlussdatum, aktuelle Phase, Schätzbetrag und Erfolgsquote. Verkaufsphasen lassen sich dynamisch verwalten; bei Verlust werden Gründe protokolliert, um die Verkaufsstrategie zu optimieren. Mehrere Produkte können einer Opportunity zugeordnet werden, der Gesamtbetrag wird automatisch berechnet.

### Zugehörige Datentabellen

- **Opportunities (Opportunity-Tabelle)**
  Detailinformationen jeder Verkaufschance wie Abschlussdatum, Verkaufsphase und Schätzbetrag.
- **OpportunityLineItem (Opportunity-Positionen)**
  Speichert Produktdaten zu einer Opportunity (Produkt-ID, Menge, Stückpreis, Rabatt etc.), unterstützt automatische Betragsberechnung.

### Konvertierungsschritte

- Opportunity anlegen → Verwaltung (Phasenwechsel) → Angebot erzeugen → Kundenfreigabe → Verkaufsauftrag erzeugen → Auftragsausführung und Statusaktualisierung

---

## 4. Produkte und Preisliste

### Funktionsübersicht

Dieses Modul verwaltet Produktinformationen und Preisstrategien. Erfasst werden Produktcode, Name, Beschreibung, Bestand und Preis; mehrere Preismodelle werden unterstützt. Durch die Verknüpfung von Produkten mit Preislisten lassen sich Preise flexibel auf Märkte und Kundengruppen ausrichten.

### Zugehörige Datentabellen

- **Products (Produkttabelle)**
  Grundlage für Angebote und Auftragsanlage.
- **PriceBooks (Preisliste)**
  Verschiedene Preismodelle und zugehörige Produkte, dynamisch anpassbar.

---

## 5. Angebotsverwaltung

### Funktionsübersicht

Das Angebotsmodul erzeugt aus bestehenden Opportunities formelle Angebote und erfasst Gültigkeit, Rabatt, Steuersatz und Gesamtbetrag. Ein integrierter Freigabeprozess erlaubt der Führungsebene Prüfung und Anpassung; jedes Angebot kann mehrere Produktpositionen enthalten und stellt korrekte Berechnungen sicher.

### Zugehörige Datentabellen

- **Quotes (Angebote)**
  Grundinformationen zu Angeboten - verknüpfte Opportunity, Gültigkeit, Rabatt, Steuersatz und Gesamtstatus.
- **QuoteLineItems (Angebotspositionen)**
  Detaildaten zu jedem Produkt im Angebot, automatische Berechnung von Positions- und Gesamtbeträgen.

---

## 6. Verkaufsauftragsverwaltung

### Funktionsübersicht

Dieses Modul wandelt freigegebene Angebote in Verkaufsaufträge um und verfolgt sie von der Erstellung bis zur Fertigstellung. Anwender sehen Auftragsstatus, Freigabehistorie sowie Logistik und Versand in Echtzeit.

### Zugehörige Datentabellen

- **SalesOrders (Verkaufsaufträge)**
  Detailinformationen zu Aufträgen wie verknüpftes Angebot, Auftragsstatus, Freigabehistorie, Versandstatus und Anlagezeit.

---

## 7. Aktivitätenmanagement

### Funktionsübersicht

Das Aktivitätenmodul unterstützt Vertriebsteams beim Organisieren ihres Tagesgeschäfts - Aufgaben, Meetings und Telefonate. Inhalte, Teilnehmer und Notizen werden erfasst; Termin- und Erinnerungsfunktionen sorgen dafür, dass Aktivitäten plangemäß stattfinden.

### Zugehörige Datentabellen

- **Activities (Aktivitäten)**
  Aufgaben, Meetings und Telefonate mit Aktivitätstyp, Datum, Teilnehmern sowie zugehörigen Kunden- oder Opportunity-Informationen.

---

## 8. Reporting und Analyse

### Funktionsübersicht

Dieses Modul liefert mehrdimensionale Statistiken und Diagramme, die Verkaufsleistung und Geschäftsumsetzung in Echtzeit sichtbar machen. Verkaufstrichter, Conversion-Analysen und Performance-Reports unterstützen das Management.

### Hinweis

Das Modul nutzt keine eigene Datentabelle, sondern aggregiert die Daten der vorgenannten Module zu Echtzeit-Feedback und Trendprognosen.

---

## 9. Marketing-Aktivitätenmanagement (optionales Modul)

### Funktionsübersicht

Als Hilfsfunktion plant und verfolgt dieses Modul Marketingkampagnen. Erfasst werden Planung, Budget, Durchführung und Ergebnis; Conversion-Rates und ROI werden ausgewertet, um Marketingaktivitäten datenbasiert zu steuern.

### Hinweis

Die Datenstruktur kann je nach Bedarf erweitert werden. Aktuell liegt der Fokus auf der Erfassung der Durchführungsdaten und ergänzt das Lead-Management.
