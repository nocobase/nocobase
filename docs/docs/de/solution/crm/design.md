:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/solution/crm/design).
:::

# CRM 2.0 System - Detailliertes Design

## 1. Systemübersicht und Designphilosophie

### 1.1 Systempositionierung

Dieses System ist eine auf der No-Code-Plattform NocoBase aufgebaute **CRM 2.0 Vertriebsmanagement-Plattform**. Das Kernziel ist:

```
Lassen Sie den Vertrieb sich auf den Aufbau von Kundenbeziehungen konzentrieren, anstatt auf Dateneingabe und repetitive Analysen.
```

Das System automatisiert Routineaufgaben durch Workflows und nutzt KI zur Unterstützung bei der Lead-Bewertung, Verkaufschancen-Analyse und anderen Aufgaben, um die Effizienz der Vertriebsteams zu steigern.

### 1.2 Designphilosophie

#### Philosophie 1: Vollständiger Vertriebstrichter

**End-to-End-Vertriebsprozess:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Warum wurde dieses Design gewählt?**

| Traditionelle Methode | Integriertes CRM |
|---------|-----------|
| Mehrere Systeme für verschiedene Phasen | Ein einziges System für den gesamten Lebenszyklus |
| Manueller Datentransfer zwischen Systemen | Automatisierter Datenfluss und Konvertierung |
| Inkonsistente Kundenansichten | Einheitliche 360-Grad-Kundenansicht |
| Fragmentierte Datenanalyse | End-to-End-Vertriebspipeline-Analyse |

#### Philosophie 2: Konfigurierbare Vertriebspipeline
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

Verschiedene Branchen können die Phasen der Vertriebspipeline anpassen, ohne den Code zu ändern.

#### Philosophie 3: Modulares Design

- Kernmodule (Kunden + Verkaufschancen) sind erforderlich; andere Module können nach Bedarf aktiviert werden.
- Das Deaktivieren von Modulen erfordert keine Codeänderungen; es erfolgt über die Konfiguration der NocoBase-Benutzeroberfläche.
- Jedes Modul ist unabhängig konzipiert, um die Kopplung zu reduzieren.

---

## 2. Modularchitektur und Anpassung

### 2.1 Modulübersicht

Das CRM-System verwendet ein **modulares Architekturdesign** – jedes Modul kann basierend auf den Geschäftsanforderungen unabhängig aktiviert oder deaktiviert werden.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Modulabhängigkeiten

| Modul | Erforderlich | Abhängigkeiten | Bedingung für Deaktivierung |
|-----|---------|--------|---------|
| **Kundenmanagement** | ✅ Ja | - | Kann nicht deaktiviert werden (Kern) |
| **Management von Verkaufschancen** | ✅ Ja | Kundenmanagement | Kann nicht deaktiviert werden (Kern) |
| **Lead-Management** | Optional | - | Wenn keine Lead-Akquise erforderlich ist |
| **Angebotsmanagement** | Optional | Verkaufschancen, Produkte | Einfache Transaktionen, die kein formelles Angebot erfordern |
| **Bestellmanagement** | Optional | Verkaufschancen (oder Angebote) | Wenn keine Bestell-/Zahlungsverfolgung erforderlich ist |
| **Produktmanagement** | Optional | - | Wenn kein Produktkatalog erforderlich ist |
| **E-Mail-Integration** | Optional | Kunden, Kontakte | Bei Verwendung eines externen E-Mail-Systems |

### 2.3 Vorkonfigurierte Versionen

| Version | Enthaltene Module | Anwendungsfall | Anzahl der Sammlungen |
|-----|---------|---------|-----------|
| **Light-Version** | Kunden + Verkaufschancen | Einfache Transaktionsverfolgung | 6 |
| **Standard-Version** | Light + Leads + Angebote + Bestellungen + Produkte | Vollständiger Verkaufszyklus | 15 |
| **Enterprise-Version** | Standard + E-Mail-Integration | Vollständiger Funktionsumfang inklusive E-Mail | 17 |

### 2.4 Modul-zu-Sammlung-Zuordnung

#### Kernmodul-Sammlungen (Immer erforderlich)

| Sammlung | Modul | Beschreibung |
|-------|------|------|
| nb_crm_customers | Kundenmanagement | Kunden-/Unternehmensdatensätze |
| nb_crm_contacts | Kundenmanagement | Kontakte |
| nb_crm_customer_shares | Kundenmanagement | Berechtigungen zur Kundenfreigabe |
| nb_crm_opportunities | Management von Verkaufschancen | Verkaufschancen |
| nb_crm_opportunity_stages | Management von Verkaufschancen | Phasenkonfigurationen |
| nb_crm_opportunity_users | Management von Verkaufschancen | Mitarbeiter an Verkaufschancen |
| nb_crm_activities | Aktivitätsmanagement | Aktivitätsaufzeichnungen |
| nb_crm_comments | Aktivitätsmanagement | Kommentare/Notizen |
| nb_crm_tags | Kern | Gemeinsame Tags |
| nb_cbo_currencies | Basisdaten | Währungswörterbuch |
| nb_cbo_regions | Basisdaten | Länder-/Regionenwörterbuch |

### 2.5 So deaktivieren Sie Module

Blenden Sie einfach den Menüeintrag für das Modul in der NocoBase-Administrationsoberfläche aus; es ist nicht erforderlich, den Code zu ändern oder Sammlungen zu löschen.

---

## 3. Kernentitäten und Datenmodell

### 3.1 Übersicht der Entitätsbeziehungen
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Details der Kernsammlungen

#### 3.2.1 Leads (nb_crm_leads)

Lead-Management mit einem vereinfachten 4-Phasen-Workflow.

**Phasenprozess:**
```
Neu → In Bearbeitung → Qualifiziert → In Kunde/Verkaufschance umgewandelt
         ↓          ↓
 Nicht qualifiziert Nicht qualifiziert
```

**Schlüsselfelder:**

| Feld | Typ | Beschreibung |
|-----|------|------|
| id | BIGINT | Primärschlüssel |
| lead_no | VARCHAR | Lead-Nummer (automatisch generiert) |
| name | VARCHAR | Name des Kontakts |
| company | VARCHAR | Unternehmensname |
| title | VARCHAR | Berufsbezeichnung |
| email | VARCHAR | E-Mail |
| phone | VARCHAR | Telefon |
| mobile_phone | VARCHAR | Mobil |
| website | TEXT | Website |
| address | TEXT | Adresse |
| source | VARCHAR | Lead-Quelle: Website/Anzeigen/Empfehlung/Messe/Telemarketing/E-Mail/Social Media |
| industry | VARCHAR | Branche |
| annual_revenue | VARCHAR | Skala des Jahresumsatzes |
| number_of_employees | VARCHAR | Skala der Mitarbeiterzahl |
| status | VARCHAR | Status: new/working/qualified/unqualified |
| rating | VARCHAR | Bewertung: heiß/warm/kalt |
| owner_id | BIGINT | Besitzer (FK → users) |
| ai_score | INTEGER | KI-Qualitätsbewertung 0-100 |
| ai_convert_prob | DECIMAL | KI-Konversionswahrscheinlichkeit |
| ai_best_contact_time | VARCHAR | KI-empfohlene Kontaktzeit |
| ai_tags | JSONB | KI-generierte Tags |
| ai_scored_at | TIMESTAMP | KI-Bewertungszeitpunkt |
| ai_next_best_action | TEXT | KI-Vorschlag für den nächsten besten Schritt |
| ai_nba_generated_at | TIMESTAMP | KI-Vorschlagsgenerierungszeitpunkt |
| is_converted | BOOLEAN | Umwandlungs-Flag |
| converted_at | TIMESTAMP | Umwandlungszeitpunkt |
| converted_customer_id | BIGINT | ID des umgewandelten Kunden |
| converted_contact_id | BIGINT | ID des umgewandelten Kontakts |
| converted_opportunity_id | BIGINT | ID der umgewandelten Verkaufschance |
| lost_reason | TEXT | Verlustgrund |
| disqualification_reason | TEXT | Disqualifikationsgrund |
| description | TEXT | Beschreibung |

#### 3.2.2 Kunden (nb_crm_customers)

Kunden-/Unternehmensmanagement zur Unterstützung des internationalen Geschäfts.

**Schlüsselfelder:**

| Feld | Typ | Beschreibung |
|-----|------|------|
| id | BIGINT | Primärschlüssel |
| name | VARCHAR | Kundenname (erforderlich) |
| account_number | VARCHAR | Kundennummer (automatisch generiert, eindeutig) |
| phone | VARCHAR | Telefon |
| website | TEXT | Website |
| address | TEXT | Adresse |
| industry | VARCHAR | Branche |
| type | VARCHAR | Typ: Interessent/Kunde/Partner/Wettbewerber |
| number_of_employees | VARCHAR | Skala der Mitarbeiterzahl |
| annual_revenue | VARCHAR | Skala des Jahresumsatzes |
| level | VARCHAR | Ebene: normal/wichtig/VIP |
| status | VARCHAR | Status: potenziell/aktiv/ruhend/abgewandert |
| country | VARCHAR | Land |
| region_id | BIGINT | Region (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Bevorzugte Währung: CNY/USD/EUR |
| owner_id | BIGINT | Besitzer (FK → users) |
| parent_id | BIGINT | Muttergesellschaft (FK → selbst) |
| source_lead_id | BIGINT | Quell-Lead-ID |
| ai_health_score | INTEGER | KI-Gesundheitsbewertung 0-100 |
| ai_health_grade | VARCHAR | KI-Gesundheitsstufe: A/B/C/D |
| ai_churn_risk | DECIMAL | KI-Abwanderungsrisiko 0-100% |
| ai_churn_risk_level | VARCHAR | KI-Abwanderungsrisikostufe: niedrig/mittel/hoch |
| ai_health_dimensions | JSONB | KI-Gesundheitsdimensionsbewertungen |
| ai_recommendations | JSONB | KI-Empfehlungsliste |
| ai_health_assessed_at | TIMESTAMP | KI-Gesundheitsbewertungszeitpunkt |
| ai_tags | JSONB | KI-generierte Tags |
| ai_best_contact_time | VARCHAR | KI-empfohlene Kontaktzeit |
| ai_next_best_action | TEXT | KI-Vorschlag für den nächsten besten Schritt |
| ai_nba_generated_at | TIMESTAMP | KI-Vorschlagsgenerierungszeitpunkt |
| description | TEXT | Beschreibung |
| is_deleted | BOOLEAN | Soft-Delete-Flag |

#### 3.2.