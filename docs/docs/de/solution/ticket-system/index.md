:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/solution/ticket-system/index).
:::

# Einführung in die Ticket-Lösung

> **Hinweis**: Dies ist eine frühe Vorschauversion. Die Funktionen sind noch nicht vollständig und wir arbeiten kontinuierlich an Verbesserungen. Feedback ist willkommen!

## 1. Hintergrund (Warum)

### Welche Branchen / Rollen / Managementprobleme werden gelöst?

Unternehmen stehen in ihrem täglichen Betrieb vor verschiedenen Arten von Serviceanfragen: Gerätereparaturen, IT-Support, Kundenbeschwerden, Beratungsanfragen usw. Diese Anfragen stammen aus verstreuten Quellen (CRM-Systeme, Außendiensttechniker, E-Mails, öffentliche Formulare usw.), folgen unterschiedlichen Bearbeitungs-Workflows und es mangelt an einheitlichen Verfolgungs- und Managementmechanismen.

**Beispiele für typische Geschäftsszenarien:**

- **Gerätereparatur**: Das After-Sales-Team bearbeitet Reparaturanfragen für Geräte und muss gerätespezifische Informationen wie Seriennummern, Fehlercodes und Ersatzteile erfassen.
- **IT-Support**: Die IT-Abteilung bearbeitet interne Anfragen von Mitarbeitern zur Passwortrücksetzung, Softwareinstallation oder zu Netzwerkproblemen.
- **Kundenbeschwerden**: Das Kundenservice-Team bearbeitet Beschwerden über mehrere Kanäle; emotional aufgeladene Kunden müssen prioritär behandelt werden.
- **Kunden-Self-Service**: Endkunden möchten Serviceanfragen bequem einreichen und den Bearbeitungsfortschritt verfolgen können.

### Zielgruppenprofil

| Dimension | Beschreibung |
|-----------|-------------|
| Unternehmensgröße | Kleine und mittlere Unternehmen (KMU) bis hin zu großen Unternehmen mit erheblichem Kundenservice-Bedarf |
| Rollenstruktur | Kundenservice-Teams, IT-Support, After-Sales-Teams, Betriebsmanagement |
| Digitale Reife | Anfänger bis Fortgeschrittene, die ein Upgrade von der Verwaltung per Excel/E-Mail auf ein systematisches Management suchen |

### Schwachstellen aktueller Mainstream-Lösungen

- **Hohe Kosten / Langsame Anpassung**: SaaS-Ticketsysteme sind teuer, und individuelle Entwicklungszyklen sind lang.
- **Systemfragmentierung, Datensilos**: Geschäftsdaten sind über verschiedene Systeme verteilt, was einheitliche Analysen und Entscheidungsfindungen erschwert.
- **Schnelle geschäftliche Veränderungen, schwer erweiterbare Systeme**: Wenn sich Geschäftsanforderungen ändern, lassen sich bestehende Systeme nur schwer schnell anpassen.
- **Langsame Service-Reaktion**: Anfragen, die zwischen verschiedenen Systemen fließen, können nicht rechtzeitig zugewiesen werden.
- **Intransparente Prozesse**: Kunden können den Ticket-Fortschritt nicht verfolgen; häufige Nachfragen erhöhen den Druck auf den Kundenservice.
- **Qualität schwer zu garantieren**: Es fehlt an SLA-Überwachung; Zeitüberschreitungen und negatives Feedback werden nicht rechtzeitig gemeldet.

---

## 2. Vergleich mit Referenzprodukten (Benchmark)

### Gängige Produkte auf dem Markt

- **SaaS**: Salesforce, Zendesk, Odoo usw.
- **Individualsysteme / Interne Systeme**

### Vergleichsdimensionen

- Funktionsumfang
- Flexibilität
- Erweiterbarkeit
- Art der KI-Nutzung

### Unterscheidungsmerkmale der NocoBase-Lösung

**Vorteile auf Plattformebene:**

- **Konfigurationsorientiert (Configuration-First)**: Von den zugrunde liegenden Datentabellen über Geschäftstypen und SLAs bis hin zum Skill-basierten Routing wird alles über Konfigurationen verwaltet.
- **Schnelle Low-Code-Entwicklung**: Schneller als Eigenentwicklungen und flexibler als SaaS-Lösungen.

**Was traditionelle Systeme nicht leisten können oder was dort extrem kostspielig ist:**

- **Native KI-Integration**: Nutzung der KI-Plugins von NocoBase für intelligente Klassifizierung, Unterstützung beim Ausfüllen von Formularen und Wissensempfehlungen.
- **Alle Designs sind für Benutzer kopierbar**: Benutzer können bestehende Vorlagen als Basis für eigene Erweiterungen nutzen.
- **T-förmige Datenarchitektur**: Haupttabelle + Geschäfts-Erweiterungstabellen; das Hinzufügen neuer Geschäftstypen erfordert lediglich das Hinzufügen einer Erweiterungstabelle.

---

## 3. Designprinzipien (Principles)

- **Geringer kognitiver Aufwand**
- **Geschäft vor Technologie**
- **Entwicklungsfähig, kein Einmalprojekt**
- **Konfiguration zuerst, Code als Absicherung**
- **Zusammenarbeit von Mensch und KI, kein Ersatz des Menschen durch KI**
- **Alle Designs sollten für Benutzer kopierbar sein**

---

## 4. Lösungsübersicht (Solution Overview)

### Zusammenfassende Einführung

Ein universelles Ticket-Zentrum, das auf der NocoBase Low-Code-Plattform basiert und Folgendes ermöglicht:

- **Einheitlicher Zugang**: Integration mehrerer Quellen, standardisierte Verarbeitung.
- **Intelligente Verteilung**: KI-gestützte Klassifizierung, lastverteilte Zuweisung.
- **Polymorphes Geschäft**: Kern-Haupttabelle + Geschäfts-Erweiterungstabellen für flexible Erweiterungen.
- **Geschlossener Feedback-Kreislauf**: SLA-Überwachung, Kundenbewertungen, Nachverfolgung von negativem Feedback.

### Ticket-Bearbeitungsprozess

```
Multi-Quellen-Eingang → Vorverarbeitung/KI-Analyse → Intelligente Zuweisung → Manuelle Ausführung → Feedback-Schleife
          ↓                        ↓                          ↓                      ↓                  ↓
  Dublettenprüfung         Absichtserkennung          Skill-Matching          Statusfluss        Zufriedenheitsbewertung
                           Stimmungsanalyse           Lastverteilung          SLA-Überwachung    Negativ-Feedback-Follow-up
                           Auto-Antwort               Warteschlangen-Mgmt.    Kommunikation      Datenarchivierung
```

### Liste der Kernmodule

| Modul | Beschreibung |
|------|------|
| Ticket-Eingang | Öffentliche Formulare, Kundenportal, manuelle Aufnahme, API/Webhook, E-Mail-Parsing |
| Ticket-Management | Ticket-CRUD, Statusfluss, Zuweisung/Weiterleitung, Kommunikation, Betriebsprotokolle |
| Geschäftserweiterung | Erweiterungstabellen für Gerätereparatur, IT-Support, Kundenbeschwerden usw. |
| SLA-Management | SLA-Konfiguration, Warnungen bei Zeitüberschreitung, Eskalation |
| Kundenmanagement | Kunden-Haupttabelle, Kontaktverwaltung, Kundenportal |
| Bewertungssystem | Mehrdimensionale Bewertung, Schnell-Tags, NPS, Warnungen bei negativem Feedback |
| KI-Unterstützung | Absichtsklassifizierung, Stimmungsanalyse, Wissensempfehlungen, Antwortunterstützung, Textoptimierung |

### Anzeige der Kernoberfläche

![ticketing-imgs-2026-01-01-00-46-12](https://static-docs.nocobase.com/ticketing-imgs-2026-01-01-00-46-12.jpg)

---

## 5. KI-Mitarbeiter (AI Employee)

### Typen und Szenarien von KI-Mitarbeitern

- **Kundenservice-Assistent**, **Vertriebsassistent**, **Datenanalyst**, **Prüfer**
- Den Menschen unterstützen, nicht ersetzen.

### Quantifizierung des Nutzens von KI-Mitarbeitern

In dieser Lösung können KI-Mitarbeiter:

| Nutzendimension | Konkrete Effekte |
|----------|----------|
| Effizienz steigern | Automatische Klassifizierung reduziert die manuelle Sortierzeit um über 50 %; Wissensempfehlungen beschleunigen die Problemlösung. |
| Kosten senken | Automatische Antworten auf einfache Fragen reduzieren die Arbeitslast des menschlichen Kundenservice. |
| Mitarbeiter befähigen | Stimmungswarnungen helfen dem Service, sich vorzubereiten; Textoptimierung verbessert die Kommunikationsqualität. |
| Kundenzufriedenheit steigern | Schnellere Reaktion, genauere Zuweisung, professionellere Antworten. |

---

## 6. Highlights

### 1. T-förmige Datenarchitektur

- Alle Tickets nutzen eine gemeinsame Haupttabelle mit einheitlicher Logik für den Workflow.
- Geschäfts-Erweiterungstabellen enthalten typspezifische Felder und ermöglichen flexible Erweiterungen.
- Das Hinzufügen neuer Geschäftstypen erfordert nur eine neue Erweiterungstabelle, ohne den Hauptprozess zu beeinflussen.

### 2. Vollständiger Ticket-Lebenszyklus

- Neu → Zugewiesen → In Bearbeitung → Ausgesetzt → Gelöst → Geschlossen.
- Unterstützung komplexer Szenarien wie Weiterleitung, Rückgabe und Wiedereröffnung.
- SLA-Zeitmessung ist präzise bis hin zu Pausen während des Aussetzens.

### 3. Einheitliche Multi-Kanal-Integration

- Öffentliche Formulare, Kundenportal, API, E-Mail, manuelle Aufnahme durch Agenten.
- Idempotenzprüfung verhindert die Erstellung von Duplikaten.

### 4. Native KI-Integration

- Kein bloßes Hinzufügen eines „KI-Buttons“, sondern Integration in jeden einzelnen Schritt.
- Absichtserkennung, Stimmungsanalyse, Wissensempfehlungen und Textoptimierung.

---

## 7. Installation & Bereitstellung

### Installation und Verwendung

Nutzen Sie das Migrationsmanagement, um verschiedene Teil-Anwendungen in andere Anwendungen zu migrieren und zu integrieren.

---

## 8. Roadmap (Kontinuierliche Aktualisierung)

- **Systemeinbettung**: Unterstützung der Einbettung des Ticket-Moduls in verschiedene Geschäftssysteme wie ERP, CRM usw.
- **Ticket-Vernetzung**: Integration von Tickets aus Upstream-/Downstream-Systemen und Status-Callbacks für systemübergreifende Zusammenarbeit.
- **KI-Automatisierung**: In Workflows eingebettete KI-Mitarbeiter, die eine automatische Hintergrundausführung für eine unbeaufsichtigte Verarbeitung unterstützen.
- **Mandantenfähigkeit**: Horizontale Skalierung über eine Multi-Space/Multi-App-Architektur, um den Betrieb für verschiedene Serviceteams unabhängig zu gestalten.
- **Wissensdatenbank RAG**: Automatische Vektorisierung aller Daten (Tickets, Kunden, Produkte usw.) für intelligente Suche und Wissensempfehlungen.
- **Mehrsprachigkeit**: Unterstützung mehrerer Sprachen für Benutzeroberfläche und Inhalte, um die Zusammenarbeit in internationalen Teams zu ermöglichen.