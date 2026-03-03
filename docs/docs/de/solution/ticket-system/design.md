:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/solution/ticket-system/design).
:::

# Detailliertes Design der Ticket-Lösung

> **Version**: v2.0-beta

> **Aktualisierungsdatum**: 05.01.2026

> **Status**: Vorschau

## 1. Systemübersicht und Designphilosophie

### 1.1 Systempositionierung

Dieses System ist eine **KI-gestützte intelligente Ticket-Management-Plattform**, die auf der Low-Code-Plattform NocoBase aufbaut. Das Kernziel ist:

```
Lassen Sie den Kundenservice sich auf die Problemlösung konzentrieren, anstatt auf mühsame Prozessabläufe.
```

### 1.2 Designphilosophie

#### Philosophie Eins: T-förmige Datenarchitektur

**Was ist eine T-förmige Architektur?**

In Anlehnung an das Konzept der „T-förmigen Talente“ – horizontale Breite + vertikale Tiefe:

- **Horizontal (Haupttabelle)**: Deckt allgemeine Funktionen für alle Geschäftstypen ab – Ticketnummer, Status, Bearbeiter, SLA und andere Kernfelder.
- **Vertikal (Erweiterungstabellen)**: Vertieft spezifische Geschäftsfelder – die Gerätereparatur enthält Seriennummern, Beschwerden enthalten Entschädigungspläne.

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-50-45.png)

**Warum dieses Design?**

| Traditionelle Lösung | T-förmige Architektur |
|----------|---------|
| Eine Tabelle pro Geschäftstyp, Feldwiederholungen | Gemeinsame Felder werden zentral verwaltet, Geschäftsfelder nach Bedarf erweitert |
| Statistische Berichte erfordern das Zusammenführen mehrerer Tabellen | Eine Haupttabelle zur direkten Statistik aller Tickets |
| Prozessänderungen müssen an vielen Stellen angepasst werden | Kernprozesse werden nur an einer Stelle geändert |
| Neue Geschäftstypen erfordern neue Tabellen | Nur Erweiterungstabellen hinzufügen, der Hauptprozess bleibt unverändert |

#### Philosophie Zwei: KI-Mitarbeiter-Team

Nicht nur „KI-Funktionen“, sondern „KI-Mitarbeiter“. Jede KI hat eine klare Rolle, Persönlichkeit und Verantwortlichkeiten:

| KI-Mitarbeiter | Position | Kernaufgaben | Trigger-Szenario |
|--------|------|----------|----------|
| **Sam** | Service-Desk-Leiter | Ticket-Routing, Prioritätsbewertung, Eskalationsentscheidungen | Automatisch bei Ticket-Erstellung |
| **Grace** | Customer-Success-Expertin | Antwortgenerierung, Tonfallanpassung, Beschwerdemanagement | Klick auf „KI-Antwort“ durch Mitarbeiter |
| **Max** | Wissensassistent | Ähnliche Fälle, Wissensempfehlungen, Lösungssynthese | Automatisch auf der Ticket-Detailseite |
| **Lexi** | Übersetzerin | Mehrsprachige Übersetzung, Kommentarübersetzung | Automatisch bei Erkennung von Fremdsprachen |

**Warum das Modell „KI-Mitarbeiter“?**

- **Klare Verantwortlichkeiten**: Sam kümmert sich um das Routing, Grace um die Antworten – kein Durcheinander.
- **Leicht verständlich**: Dem Benutzer zu sagen „Lassen Sie Sam das analysieren“ ist freundlicher als „Klassifizierungs-API aufrufen“.
- **Erweiterbar**: Neue KI-Fähigkeiten hinzufügen = Neue Mitarbeiter einstellen.

#### Philosophie Drei: Wissens-Selbstkreislauf

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-09.png)

Dies bildet einen geschlossenen Kreislauf aus **Wissensakkumulation und Wissensanwendung**.

---

## 2. Kernentitäten und Datenmodell

### 2.1 Übersicht der Entitätsbeziehungen

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-23.png)


### 2.2 Details der Kerntabellen

#### 2.2.1 Ticket-Haupttabelle (nb_tts_tickets)

Dies ist das Herzstück des Systems, das ein „Wide Table“-Design verwendet, bei dem alle häufig verwendeten Felder in der Haupttabelle enthalten sind.

**Basisinformationen**

| Feld | Typ | Beschreibung | Beispiel |
|------|------|------|------|
| id | BIGINT | Primärschlüssel | 1001 |
| ticket_no | VARCHAR | Ticketnummer | TKT-20251229-0001 |
| title | VARCHAR | Titel | Langsame Netzwerkverbindung |
| description | TEXT | Problembeschreibung | Seit heute Morgen im Büro... |
| biz_type | VARCHAR | Geschäftstyp | it_support |
| priority | VARCHAR | Priorität | P1 |
| status | VARCHAR | Status | processing |

**Herkunftsverfolgung**

| Feld | Typ | Beschreibung | Beispiel |
|------|------|------|------|
| source_system | VARCHAR | Quellsystem | crm / email / iot |
| source_channel | VARCHAR | Quellkanal | web / phone / wechat |
| external_ref_id | VARCHAR | Externe Referenz-ID | CRM-2024-0001 |

**Kontaktinformationen**

| Feld | Typ | Beschreibung |
|------|------|------|
| customer_id | BIGINT | Kunden-ID |
| contact_name | VARCHAR | Name des Ansprechpartners |
| contact_phone | VARCHAR | Telefonnummer |
| contact_email | VARCHAR | E-Mail-Adresse |
| contact_company | VARCHAR | Firmenname |

**Bearbeiterinformationen**

| Feld | Typ | Beschreibung |
|------|------|------|
| assignee_id | BIGINT | Bearbeiter-ID |
| assignee_department_id | BIGINT | Abteilungs-ID des Bearbeiters |
| transfer_count | INT | Anzahl der Weiterleitungen |

**Zeitstempel**

| Feld | Typ | Beschreibung | Trigger-Zeitpunkt |
|------|------|------|----------|
| submitted_at | TIMESTAMP | Einreichungszeitpunkt | Bei Ticket-Erstellung |
| assigned_at | TIMESTAMP | Zuweisungszeitpunkt | Bei Festlegung des Bearbeiters |
| first_response_at | TIMESTAMP | Erstbeantwortungszeit | Bei der ersten Antwort an den Kunden |
| resolved_at | TIMESTAMP | Lösungszeitpunkt | Wenn Status auf „resolved“ wechselt |
| closed_at | TIMESTAMP | Abschlusszeitpunkt | Wenn Status auf „closed“ wechselt |

**SLA-Bezug**

| Feld | Typ | Beschreibung |
|------|------|------|
| sla_config_id | BIGINT | SLA-Konfigurations-ID |
| sla_response_due | TIMESTAMP | Frist für Erstbeantwortung |
| sla_resolve_due | TIMESTAMP | Frist für Lösung |
| sla_paused_at | TIMESTAMP | Beginn der SLA-Pause |
| sla_paused_duration | INT | Kumulierte Pausendauer (Minuten) |
| is_sla_response_breached | BOOLEAN | Antwortfrist verletzt |
| is_sla_resolve_breached | BOOLEAN | Lösungsfrist verletzt |

**KI-Analyseergebnisse**

| Feld | Typ | Beschreibung | Befüllt durch |
|------|------|------|----------|
| ai_category_code | VARCHAR | KI-identifizierte Kategorie | Sam |
| ai_sentiment | VARCHAR | Stimmungsanalyse | Sam |
| ai_urgency | VARCHAR | Dringlichkeit | Sam |
| ai_keywords | JSONB | Schlüsselwörter | Sam |
| ai_reasoning | TEXT | Argumentationsprozess | Sam |
| ai_suggested_reply | TEXT | Antwortvorschlag | Sam/Grace |
| ai_confidence_score | NUMERIC | Konfidenzwert | Sam |
| ai_analysis | JSONB | Vollständiges Analyseergebnis | Sam |

**Mehrsprachigkeitsunterstützung**

| Feld | Typ | Beschreibung | Befüllt durch |
|------|------|------|----------|
| source_language_code | VARCHAR | Quellsprache | Sam/Lexi |
| target_language_code | VARCHAR | Zielsprache | Systemstandard EN |
| is_translated | BOOLEAN | Wurde übersetzt | Lexi |
| description_translated | TEXT | Übersetzte Beschreibung | Lexi |

#### 2.2.2 Geschäfts-Erweiterungstabellen

**Gerätereparatur (nb_tts_biz_repair)**

| Feld | Typ | Beschreibung |
|------|------|------|
| ticket_id | BIGINT | Zugehörige Ticket-ID |
| equipment_model | VARCHAR | Gerätemodell |
| serial_number | VARCHAR | Seriennummer |
| fault_code | VARCHAR | Fehlercode |
| spare_parts | JSONB | Ersatzteilliste |
| maintenance_type | VARCHAR | Wartungstyp |

**IT-Support (nb_tts_biz_it_support)**

| Feld | Typ | Beschreibung |
|------|------|------|
| ticket_id | BIGINT | Zugehörige Ticket-ID |
| asset_number | VARCHAR | Inventarnummer |
| os_version | VARCHAR | Betriebssystemversion |
| software_name | VARCHAR | Betroffene Software |
| remote_address | VARCHAR | Remote-Adresse |
| error_code | VARCHAR | Fehlercode |

**Kundenbeschwerde (nb_tts_biz_complaint)**

| Feld | Typ | Beschreibung |
|------|------|------|
| ticket_id | BIGINT | Zugehörige Ticket-ID |
| related_order_no | VARCHAR | Zugehörige Bestellnummer |
| complaint_level | VARCHAR | Beschwerdestufe |
| compensation_amount | DECIMAL | Entschädigungsbetrag |
| compensation_type | VARCHAR | Entschädigungsart |
| root_cause | TEXT | Grundursache |

#### 2.2.3 Kommentartabelle (nb_tts_ticket_comments)

**Kernfelder**

| Feld | Typ | Beschreibung |
|------|------|------|
| id | BIGINT | Primärschlüssel |
| ticket_id | BIGINT | Ticket-ID |
| parent_id | BIGINT | Eltern-Kommentar-ID (unterstützt Baumstruktur) |
| content | TEXT | Kommentarinhalt |
| direction | VARCHAR | Richtung: inbound (Kunde) / outbound (Mitarbeiter) |
| is_internal | BOOLEAN | Interner Vermerk |
| is_first_response | BOOLEAN | Ist Erstbeantwortung |

**KI-Prüffelder (für outbound)**

| Feld | Typ | Beschreibung |
|------|------|------|
| source_language_code | VARCHAR | Quellsprache |
| content_translated | TEXT | Übersetzter Inhalt |
| is_translated | BOOLEAN | Wurde übersetzt |
| is_ai_blocked | BOOLEAN | Von KI blockiert |
| ai_block_reason | VARCHAR | Blockierungsgrund |
| ai_block_detail | TEXT | Detaillierte Erläuterung |
| ai_quality_score | NUMERIC | Qualitätsbewertung |
| ai_suggestions | TEXT | Verbesserungsvorschläge |

#### 2.2.4 Bewertungstabelle (nb_tts_ratings)

| Feld | Typ | Beschreibung |
|------|------|------|
| ticket_id | BIGINT | Ticket-ID (eindeutig) |
| overall_rating | INT | Gesamtzufriedenheit (1-5) |
| response_rating | INT | Antwortgeschwindigkeit (1-5) |
| professionalism_rating | INT | Professionalität (1-5) |
| resolution_rating | INT | Problemlösung (1-5) |
| nps_score | INT | NPS-Score (0-10) |
| tags | JSONB | Schnell-Tags |
| comment | TEXT | Textuelle Bewertung |

#### 2.2.5 Wissensartikel-Tabelle (nb_tts_qa_articles)

| Feld | Typ | Beschreibung |
|------|------|------|
| article_no | VARCHAR | Artikelnummer KB-T0001 |
| title | VARCHAR | Titel |
| content | TEXT | Inhalt (Markdown) |
| summary | TEXT | Zusammenfassung |
| category_code | VARCHAR | Kategoriecode |
| keywords | JSONB | Schlüsselwörter |
| source_type | VARCHAR | Quelle: ticket/faq/manual |
| source_ticket_id | BIGINT | Quell-Ticket-ID |
| ai_generated | BOOLEAN | KI-generiert |
| ai_quality_score | NUMERIC | Qualitätsbewertung |
| status | VARCHAR | Status: draft/published/archived |
| view_count | INT | Anzahl der Aufrufe |
| helpful_count | INT | Als hilfreich markiert |

### 2.3 Liste der Datentabellen

| Nr. | Tabellenname | Beschreibung | Datentyp |
|------|------|------|----------|
| 1 | nb_tts_tickets | Ticket-Haupttabelle | Geschäftsdaten |
| 2 | nb_tts_biz_repair | Erweiterung Gerätereparatur | Geschäftsdaten |
| 3 | nb_tts_biz_it_support | Erweiterung IT-Support | Geschäftsdaten |
| 4 | nb_tts_biz_complaint | Erweiterung Kundenbeschwerde | Geschäftsdaten |
| 5 | nb_tts_customers | Kunden-Haupttabelle | Geschäftsdaten |
| 6 | nb_tts_customer_contacts | Kundenansprechpartner | Geschäftsdaten |
| 7 | nb_tts_ticket_comments | Ticket-Kommentare | Geschäftsdaten |
| 8 | nb_tts_ratings | Zufriedenheitsbewertungen | Geschäftsdaten |
| 9 | nb_tts_qa_articles | Wissensartikel | Wissensdaten |
| 10 | nb_tts_qa_article_relations | Artikelverknüpfungen | Wissensdaten |
| 11 | nb_tts_faqs | Häufig gestellte Fragen | Wissensdaten |
| 12 | nb_tts_tickets_categories | Ticket-Kategorien | Konfigurationsdaten |
| 13 | nb_tts_sla_configs | SLA-Konfiguration | Konfigurationsdaten |
| 14 | nb_tts_skill_configs | Kompetenz-Konfiguration | Konfigurationsdaten |
| 15 | nb_tts_business_types | Geschäftstypen | Konfigurationsdaten |

---

## 3. Ticket-Lebenszyklus

### 3.1 Statusdefinitionen

| Status | Deutsch | Beschreibung | SLA-Zeitzählung | Farbe |
|------|------|------|---------|------|
| new | Neu | Gerade erstellt, wartet auf Zuweisung | Start | 🔵 Blau |
| assigned | Zugewiesen | Bearbeiter festgelegt, wartet auf Annahme | Fortsetzen | 🔷 Cyan |
| processing | In Bearbeitung | Wird aktuell bearbeitet | Fortsetzen | 🟠 Orange |
| pending | Ausstehend | Wartet auf Rückmeldung des Kunden | **Pause** | ⚫ Grau |
| transferred | Weitergeleitet | An eine andere Person übertragen | Fortsetzen | 🟣 Violett |
| resolved | Gelöst | Wartet auf Bestätigung durch den Kunden | Stopp | 🟢 Grün |
| closed | Geschlossen | Ticket beendet | Stopp | ⚫ Grau |
| cancelled | Storniert | Ticket abgebrochen | Stopp | ⚫ Grau |

### 3.2 Status-Flussdiagramm

**Hauptprozess (von links nach rechts)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-45.png)

**Nebenprozesse**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-42.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-53.png)


**Vollständige Zustandsmaschine**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-54-23.png)

### 3.3 Wichtige Regeln für Statusübergänge

| Von | Nach | Auslösebedingung | Systemaktion |
|----|----|---------|---------|
| new | assigned | Bearbeiter zuweisen | assigned_at aufzeichnen |
| assigned | processing | Bearbeiter klickt auf „Annehmen“ | Keine |
| processing | pending | Klick auf „Aussetzen“ | sla_paused_at aufzeichnen |
| pending | processing | Kundenantwort / Manuelle Fortsetzung | Pausendauer berechnen, paused_at leeren |
| processing | resolved | Klick auf „Lösen“ | resolved_at aufzeichnen |
| resolved | closed | Kundenbestätigung / 3 Tage Zeitüberschreitung | closed_at aufzeichnen |
| * | cancelled | Ticket stornieren | Keine |


---

## 4. SLA-Service-Level-Management

### 4.1 Prioritäts- und SLA-Konfiguration

| Priorität | Name | Antwortzeit | Lösungszeit | Warnschwelle | Typisches Szenario |
|--------|------|----------|----------|----------|----------|
| P0 | Kritisch | 15 Minuten | 2 Stunden | 80% | Systemausfall, Produktionsstopp |
| P1 | Hoch | 1 Stunde | 8 Stunden | 80% | Wichtige Funktionsstörung |
| P2 | Mittel | 4 Stunden | 24 Stunden | 80% | Allgemeine Probleme |
| P3 | Niedrig | 8 Stunden | 72 Stunden | 80% | Anfragen, Vorschläge |

### 4.2 SLA-Berechnungslogik

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-53-54.png)

#### Bei Ticket-Erstellung

```
Frist für Erstbeantwortung = Einreichungszeitpunkt + Antwortzeitlimit (Minuten)
Frist für Lösung = Einreichungszeitpunkt + Lösungszeitlimit (Minuten)
```

#### Bei Aussetzung (pending)

```
SLA-Pausenbeginn = Aktuelle Zeit
```

#### Bei Fortsetzung (von pending zurück zu processing)

```
-- Aktuelle Pausendauer berechnen
Aktuelle Pausendauer = Aktuelle Zeit - SLA-Pausenbeginn

-- Zur kumulierten Pausendauer addieren
Kumulierte Pausendauer = Kumulierte Pausendauer + Aktuelle Pausendauer

-- Fristen verlängern (Pausenzeit zählt nicht zum SLA)
Frist für Erstbeantwortung = Frist für Erstbeantwortung + Aktuelle Pausendauer
Frist für Lösung = Frist für Lösung + Aktuelle Pausendauer

-- Pausenbeginn leeren
SLA-Pausenbeginn = NULL
```

#### SLA-Verletzungsprüfung

```
-- Prüfung Antwortverletzung
Antwort verletzt = (Erstbeantwortungszeit ist NULL UND Aktuelle Zeit > Frist für Erstbeantwortung)
                 ODER (Erstbeantwortungszeit > Frist für Erstbeantwortung)

-- Prüfung Lösungsverletzung
Lösung verletzt = (Lösungszeit ist NULL UND Aktuelle Zeit > Frist für Lösung)
                 ODER (Lösungszeit > Frist für Lösung)
```

### 4.3 SLA-Warnmechanismus

| Warnstufe | Bedingung | Empfänger | Benachrichtigungsart |
|----------|------|----------|----------|
| Gelbe Warnung | Verbleibende Zeit < 20% | Bearbeiter | In-App-Nachricht |
| Rote Warnung | Zeit überschritten | Bearbeiter + Vorgesetzter | In-App-Nachricht + E-Mail |
| Eskalationswarnung | 1 Stunde überschritten | Abteilungsleiter | E-Mail + SMS |

### 4.4 SLA-Dashboard-Kennzahlen

| Kennzahl | Berechnungsformel | Zielwert |
|------|----------|----------|
| Antwort-Compliance-Rate | Nicht verletzte Tickets / Gesamtzahl Tickets | > 95% |
| Lösungs-Compliance-Rate | Gelöste Tickets ohne Verletzung / Gelöste Tickets gesamt | > 90% |
| Durchschnittliche Antwortzeit | SUM(Antwortzeit) / Anzahl Tickets | < 50% des SLA |
| Durchschnittliche Lösungszeit | SUM(Lösungszeit) / Anzahl Tickets | < 80% des SLA |

---

## 5. KI-Fähigkeiten und Mitarbeiter-System

### 5.1 KI-Mitarbeiter-Team

Das System konfiguriert 8 KI-Mitarbeiter, unterteilt in zwei Kategorien:

**Spezifische Mitarbeiter (Ticket-System-exklusiv)**

| ID | Name | Position | Kernkompetenzen |
|----|------|------|----------|
| sam | Sam | Service-Desk-Leiter | Ticket-Routing, Prioritätsbewertung, Eskalationsentscheidungen, SLA-Risikoerkennung |
| grace | Grace | Customer-Success-Expertin | Professionelle Antwortgenerierung, Tonfallanpassung, Beschwerdemanagement, Zufriedenheitswiederherstellung |
| max | Max | Wissensassistent | Suche nach ähnlichen Fällen, Wissensempfehlungen, Lösungssynthese |

**Wiederverwendbare Mitarbeiter (Allgemeine Fähigkeiten)**

| ID | Name | Position | Kernkompetenzen |
|----|------|------|----------|
| dex | Dex | Datenorganisator | E-Mail-zu-Ticket, Anruf-zu-Ticket, Batch-Datenbereinigung |
| ellis | Ellis | E-Mail-Experte | E-Mail-Stimmungsanalyse, Thread-Zusammenfassung, Antwortentwürfe |
| lexi | Lexi | Übersetzerin | Ticket-Übersetzung, Antwort-Übersetzung, Echtzeit-Dialogübersetzung |
| cole | Cole | NocoBase-Experte | Anleitung zur Systemnutzung, Hilfe bei Workflow-Konfiguration |
| vera | Vera | Forschungsanalystin | Recherche technischer Lösungen, Prüfung von Produktinformationen |

### 5.2 KI-Aufgabenliste

Jeder KI-Mitarbeiter verfügt über 4 spezifische Aufgaben:

#### Aufgaben von Sam

| Aufgaben-ID | Name | Auslösung | Beschreibung |
|--------|------|----------|------|
| SAM-01 | Ticket-Analyse & Routing | Workflow automatisch | Automatische Analyse bei Ticket-Erstellung |
| SAM-02 | Prioritäts-Neubewertung | Frontend-Interaktion | Anpassung der Priorität basierend auf neuen Infos |
| SAM-03 | Eskalationsentscheidung | Frontend/Workflow | Entscheidung über notwendige Eskalation |
| SAM-04 | SLA-Risikobewertung | Workflow automatisch | Identifizierung von Zeitüberschreitungsrisiken |

#### Aufgaben von Grace

| Aufgaben-ID | Name | Auslösung | Beschreibung |
|--------|------|----------|------|
| GRACE-01 | Professionelle Antwortgenerierung | Frontend-Interaktion | Generierung von Antworten basierend auf Kontext |
| GRACE-02 | Tonfallanpassung | Frontend-Interaktion | Optimierung des Tonfalls bestehender Antworten |
| GRACE-03 | Beschwerde-Deeskalation | Frontend/Workflow | Entschärfung von Kundenbeschwerden |
| GRACE-04 | Zufriedenheitswiederherstellung | Frontend/Workflow | Nachverfolgung nach negativen Erfahrungen |

#### Aufgaben von Max

| Aufgaben-ID | Name | Auslösung | Beschreibung |
|--------|------|----------|------|
| MAX-01 | Suche nach ähnlichen Fällen | Frontend/Workflow | Finden historisch ähnlicher Tickets |
| MAX-02 | Wissensartikel-Empfehlung | Frontend/Workflow | Empfehlung relevanter Wissensartikel |
| MAX-03 | Lösungssynthese | Frontend-Interaktion | Zusammenführung von Lösungen aus mehreren Quellen |
| MAX-04 | Leitfaden zur Fehlerbehebung | Frontend-Interaktion | Erstellung systematischer Prüfprozesse |

#### Aufgaben von Lexi

| Aufgaben-ID | Name | Auslösung | Beschreibung |
|--------|------|----------|------|
| LEXI-01 | Ticket-Übersetzung | Workflow automatisch | Übersetzung von Ticket-Inhalten |
| LEXI-02 | Antwort-Übersetzung | Frontend-Interaktion | Übersetzung von Mitarbeiterantworten |
| LEXI-03 | Batch-Übersetzung | Workflow automatisch | Verarbeitung von Massenübersetzungen |
| LEXI-04 | Echtzeit-Dialogübersetzung | Frontend-Interaktion | Echtzeit-Übersetzung von Dialogen |

### 5.3 KI-Mitarbeiter und Ticket-Lebenszyklus

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-04.png)

### 5.4 Beispiele für KI-Antworten

#### SAM-01 Ticket-Analyse-Antwort

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "Login fehlgeschlagen", "Timeout", "Monatsabschluss"],
  "confidence": 0.92,
  "reasoning": "Das Ticket beschreibt ein Login-Problem im ERP-System, das den Monatsabschluss der Finanzabteilung beeinträchtigt. Die Dringlichkeit ist hoch.",
  "suggested_reply": "Sehr geehrter Kunde, vielen Dank für Ihre Meldung dieses Problems...",
  "source_language_code": "zh",
  "is_translated": true,
  "description_translated": "Hallo, unser ERP-System erlaubt keinen Login..."
}
```

#### GRACE-01 Antwortgenerierung

```
Sehr geehrter Herr Zhang,

vielen Dank, dass Sie uns bezüglich des ERP-Login-Problems kontaktiert haben. Ich verstehe vollkommen, dass dieses Problem die Monatsabschlussarbeiten Ihres Unternehmens beeinträchtigt. Wir haben dieses Ticket mit hoher Priorität eingestuft.

Aktueller Stand:
- Unser Technikteam prüft derzeit die Serververbindung.
- Wir erwarten, Ihnen innerhalb der nächsten 30 Minuten ein Update geben zu können.

In der Zwischenzeit können Sie Folgendes versuchen:
1. Zugriff über die Backup-Adresse: https://erp-backup.company.com
2. Falls Sie dringend Berichte benötigen, können wir Sie beim Export unterstützen.

Bei weiteren Fragen stehe ich Ihnen jederzeit gerne zur Verfügung.

Mit freundlichen Grüßen
Ihr technisches Support-Team
```

### 5.5 KI-Empathie-Firewall

Die von Grace durchgeführte Qualitätsprüfung fängt folgende Probleme ab:

| Problemtyp | Beispiel Originaltext | KI-Vorschlag |
|----------|----------|--------|
| Negativer Tonfall | „Nein, das fällt nicht unter die Garantie.“ | „Dieser Fehler kann derzeit nicht kostenlos repariert werden. Wir bieten Ihnen jedoch gerne eine kostenpflichtige Lösung an.“ |
| Kundenschuldzuweisung | „Sie haben es selbst kaputt gemacht.“ | „Nach Prüfung wurde festgestellt, dass es sich um einen Unfallschaden handelt.“ |
| Verantwortung ablehnen | „Das ist nicht unser Problem.“ | „Lassen Sie mich Ihnen helfen, die Ursache des Problems weiter einzugrenzen.“ |
| Kalte Ausdrucksweise | „Weiß ich nicht.“ | „Ich werde mich für Sie erkundigen und die entsprechenden Informationen heraussuchen.“ |
| Sensible Daten | „Ihr Passwort lautet abc123.“ | [Blockiert] Enthält sensible Informationen, Versand nicht erlaubt. |

---

## 6. Wissensdatenbank-System

### 6.1 Wissensquellen

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-20.png)


### 6.2 Prozess: Ticket zu Wissen

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-38.png)

**Bewertungsdimensionen**:
- **Allgemeingültigkeit**: Ist dies ein häufiges Problem?
- **Vollständigkeit**: Ist die Lösung klar und vollständig?
- **Reproduzierbarkeit**: Sind die Schritte wiederverwendbar?

### 6.3 Wissensempfehlungs-Mechanismus

Wenn ein Mitarbeiter die Ticket-Details öffnet, empfiehlt Max automatisch relevantes Wissen:

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Empfohlenes Wissen                         [Ausklappen]  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 CNC-Servosystem Fehlerdiagnose  Match: 94%    │ │
│ │ Inhalt: Alarmcode-Interpretation, Prüfschritte Treiber  │ │
│ │ [Ansehen] [In Antwort übernehmen] [Als hilfreich markieren]│ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 XYZ-CNC3000 Wartungshandbuch    Match: 87%    │ │
│ │ Inhalt: Häufige Fehler, präventiver Wartungsplan        │ │
│ │ [Ansehen] [In Antwort übernehmen] [Als hilfreich markieren]│ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Workflow-Engine

### 7.1 Workflow-Kategorien

| Nummer | Kategorie | Beschreibung | Auslösung |
|------|------|------|----------|
| WF-T | Ticket-Prozess | Ticket-Lebenszyklus-Management | Formularereignis |
| WF-S | SLA-Prozess | SLA-Berechnung und Warnung | Formularereignis / Zeitplan |
| WF-C | Kommentar-Prozess | Kommentarverarbeitung und Übersetzung | Formularereignis |
| WF-R | Bewertungs-Prozess | Bewertungseinladungen und Statistiken | Formularereignis / Zeitplan |
| WF-N | Benachrichtigungs-Prozess | Versand von Benachrichtigungen | Ereignisgesteuert |
| WF-AI | KI-Prozess | KI-Analyse und Generierung | Formularereignis |

### 7.2 Kern-Workflows

#### WF-T01: Ticket-Erstellungsprozess

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-51.png)

#### WF-AI01: Ticket-KI-Analyse

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-03.png)

#### WF-AI04: Kommentarübersetzung und -prüfung

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-19.png)

#### WF-AI03: Wissensgenerierung

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-37.png)

### 7.3 Geplante Aufgaben

| Aufgabe | Häufigkeit | Beschreibung |
|------|----------|------|
| SLA-Warnprüfung | Alle 5 Minuten | Prüfung von Tickets, die kurz vor der Zeitüberschreitung stehen |
| Automatischer Ticket-Abschluss | Täglich | Automatischer Abschluss nach 3 Tagen im Status „resolved“ |
| Versand von Bewertungseinladungen | Täglich | Versand 24 Stunden nach Ticket-Abschluss |
| Statistik-Update | Stündlich | Aktualisierung der Kunden-Ticket-Statistiken |

---

## 8. Menü- und Oberflächendesign

### 8.1 Backend-Verwaltung

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-10.png)

### 8.2 Kundenportal

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-32.png)

### 8.3 Dashboard-Design

#### Führungsebene-Ansicht

| Komponente | Typ | Datenbeschreibung |
|------|------|----------|
| SLA-Erfüllungsrate | Tacho-Diagramm | Antwort-/Lösungsrate in diesem Monat |
| Zufriedenheitstrend | Liniendiagramm | Verlauf der Zufriedenheit (letzte 30 Tage) |
| Ticket-Volumen-Trend | Balkendiagramm | Ticket-Anzahl (letzte 30 Tage) |
| Verteilung Geschäftstypen | Tortendiagramm | Anteil der verschiedenen Geschäftstypen |

#### Vorgesetzten-Ansicht

| Komponente | Typ | Datenbeschreibung |
|------|------|----------|
| Zeitüberschreitungs-Warnungen | Liste | Tickets kurz vor oder nach Zeitüberschreitung |
| Arbeitslast der Mitarbeiter | Balkendiagramm | Ticket-Anzahl pro Teammitglied |
| Rückstandsverteilung | Stapeldiagramm | Anzahl der Tickets pro Status |
| Bearbeitungseffizienz | Heatmap | Verteilung der durchschnittlichen Bearbeitungszeit |

#### Mitarbeiter-Ansicht

| Komponente | Typ | Datenbeschreibung |
|------|------|----------|
| Meine Aufgaben | Zahlenkarte | Anzahl der ausstehenden Tickets |
| Prioritätsverteilung | Tortendiagramm | Verteilung P0/P1/P2/P3 |
| Heutige Statistik | Kennzahlenkarte | Heute bearbeitete/gelöste Tickets |
| SLA-Countdown | Liste | Die 5 dringendsten Tickets |

---

## Anhang

### A. Konfiguration der Geschäftstypen

| Typcode | Name | Icon | Zugehörige Erweiterungstabelle |
|----------|------|------|------------|
| repair | Gerätereparatur | 🔧 | nb_tts_biz_repair |
| it_support | IT-Support | 💻 | nb_tts_biz_it_support |
| complaint | Kundenbeschwerde | 📢 | nb_tts_biz_complaint |
| consultation | Beratung/Vorschläge | ❓ | Keine |
| other | Sonstiges | 📝 | Keine |

### B. Kategoriecodes

| Code | Name | Beschreibung |
|------|------|------|
| CONVEYOR | Fördersystem | Probleme mit Fördersystemen |
| PACKAGING | Verpackungsmaschine | Probleme mit Verpackungsmaschinen |
| WELDING | Schweißgeräte | Probleme mit Schweißgeräten |
| COMPRESSOR | Kompressor | Probleme mit Luftkompressoren |
| COLD_STORE | Kühlhaus | Probleme mit Kühlhäusern |
| CENTRAL_AC | Zentrale Klimaanlage | Probleme mit Klimaanlagen |
| FORKLIFT | Gabelstapler | Probleme mit Gabelstaplern |
| COMPUTER | Computer | Computer-Hardwareprobleme |
| PRINTER | Drucker | Druckerprobleme |
| PROJECTOR | Projektor | Projektorprobleme |
| INTERNET | Netzwerk | Netzwerkverbindungsprobleme |
| EMAIL | E-Mail | E-Mail-Systemprobleme |
| ACCESS | Berechtigungen | Kontoberechtigungsprobleme |
| PROD_INQ | Produktanfrage | Anfragen zu Produkten |
| COMPLAINT | Allgemeine Beschwerde | Allgemeine Beschwerden |
| DELAY | Logistikverzögerung | Beschwerden über Lieferverzögerungen |
| DAMAGE | Verpackungsschaden | Beschwerden über beschädigte Verpackungen |
| QUANTITY | Fehlmenge | Beschwerden über unvollständige Lieferungen |
| SVC_ATTITUDE | Serviceeinstellung | Beschwerden über das Serviceverhalten |
| PROD_QUALITY | Produktqualität | Beschwerden über Produktqualität |
| TRAINING | Schulung | Schulungsanfragen |
| RETURN | Rücksendung | Rücksendeanfragen |

---

*Dokumentversion: 2.0 | Letzte Aktualisierung: 05.01.2026*