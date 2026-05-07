---
title: "Kunden, Kontakte und E-Mails"
description: "CRM Kunden-360-Ansicht, AI-Health-Score, Kundenzusammenführung, Verwaltung von Kontaktrollen, E-Mail-Versand und -Empfang mit AI-Unterstützung, Aktivitätenprotokoll."
keywords: "Kundenverwaltung,Kontakte,E-Mail,Health Score,Kundenzusammenführung,NocoBase CRM"
---

# Kunden, Kontakte und E-Mails

> Kunden, Kontakte und E-Mails sind drei eng miteinander verknüpfte Module – Kunden sind die Hauptobjekte, Kontakte die Ansprechpartner und E-Mails die Kommunikationsaufzeichnung. Dieses Kapitel behandelt sie zusammen.

![cn_04-customers-emails](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_04-customers-emails.png)

## Kundenverwaltung

Öffnen Sie über das obere Menü die Seite **Kunden**, die zwei Tabs enthält: Kundenliste und Tool zur Kundenzusammenführung.

### Kundenliste

Oberhalb der Liste befinden sich Filterschaltflächen:

| Filter | Beschreibung |
|---------|------|
| **All** | Alle Kunden |
| **Active** | Aktive Kunden |
| **Potential** | Potenzielle Kunden, noch keine Geschäfte abgeschlossen |
| **Dormant** | Inaktive Kunden ohne längere Interaktion |
| **Key Accounts** | Großkunden / Schlüsselkunden |
| **New This Month** | Neu in diesem Monat |


![04-customers-emails-2026-04-07-01-32-03](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-32-03.png)


**Wichtige Spalten**:

- **AI Health Score**: Ringförmiger Fortschrittsbalken von 0–100 Punkten (🟢 70–100 gesund / 🟡 40–69 Warnung / 🔴 0–39 kritisch)
- **Letzte Aktivität**: Relative Zeit + Farbcodierung – je länger kein Kontakt, desto dunkler die Farbe

### Kundendetails

Klicken Sie auf den Kundennamen, um das Detail-Popup zu öffnen, das **3 Tabs** enthält:

| Tab | Inhalt |
|-------|------|
| **Details** | Kundenprofil, Statistik-Karten, Kontakte, Verkaufschancen, Kommentare |
| **E-Mail** | E-Mail-Verkehr mit allen Kontakten dieses Kunden, 5 AI-Schaltflächen |
| **Änderungshistorie** | Audit-Log auf Feldebene |

Der **Detail-Tab** ist im Verhältnis 2/3 links + 1/3 rechts in zwei Spalten aufgeteilt:

- **Linke Spalte**: Kunden-Avatar (eingefärbt nach Stufe: Normal=grau, Important=bernstein, VIP=gold), 4-spaltige Übersicht (Stufe/Größe/Region/Typ), Statistik-Karten (kumuliertes Geschäftsvolumen / aktive Verkaufschancen / Interaktionen diesen Monat, Echtzeit-API-Abfragen), Kontaktliste, Liste der Verkaufschancen, Kommentarbereich
- **Rechte Spalte**: AI-Smart-Profil (AI-Tags, Health-Score-Ringdiagramm, Abwanderungsrisiko, beste Kontaktzeit, Kommunikationsstrategie)

![04-customers-emails-2026-04-07-01-33-47](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-33-47.png)

### AI Health Score

Der Health Score wird automatisch aus folgenden Dimensionen berechnet: Interaktionshäufigkeit, Aktivität bei Verkaufschancen, Bestellsituation, Abdeckung durch Kontakte.

Empfehlungen zur Nutzung:

1. Öffnen Sie täglich die Kundenliste und sortieren Sie nach Health Score
2. Konzentrieren Sie sich vorrangig auf rote Kunden (Critical) – diese könnten gerade abwandern
3. Gelbe Kunden (Warning) – planen Sie eine leichte Nachverfolgung
4. Grüne Kunden (Healthy) – pflegen Sie diese im normalen Rhythmus

### Kundenzusammenführung

Wenn doppelte Kundendatensätze auftreten, bereinigen Sie diese mit dem Zusammenführungs-Tool:

1. **Zusammenführung starten**: Wählen Sie in der Kundenliste mehrere Kunden aus → klicken Sie auf die Schaltfläche „Customer Merge"
2. **Zum Zusammenführungs-Tool wechseln**: Wechseln Sie zum zweiten Tab und sehen Sie sich die Liste der Zusammenführungsanfragen an (Pending / Merged / Cancelled)
3. **Zusammenführung durchführen**: Wählen Sie den Hauptdatensatz (Master) → vergleichen Sie die Unterschiede Feld für Feld → Vorschau → bestätigen. Der Hintergrund-Workflow migriert automatisch alle zugehörigen Daten (Verkaufschancen, Kontakte, Aktivitäten, Kommentare, Bestellungen, Angebote, Freigaben) und deaktiviert den zusammengeführten Kunden

![04-customers-emails-2026-04-07-01-35-37](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-35-37.png)

![04-customers-emails-2026-04-07-01-38-07](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-07.png)

:::tip[Vor dem Zusammenführen sorgfältig prüfen]
Die Kundenzusammenführung ist eine nicht umkehrbare Operation. Prüfen Sie vor der Ausführung sorgfältig die Auswahl des Hauptdatensatzes und die Übernahme der Feldwerte.
:::


![04-customers-emails-2026-04-07-01-37-44](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-37-44.gif)

---

## Kontaktverwaltung

Öffnen Sie über das obere Menü die Seite **Einstellungen → Kontakte**.

### Kontaktinformationen

| Feld | Beschreibung |
|------|------|
| Name | Name des Kontakts |
| Company | Zugehöriges Unternehmen (verknüpft mit Kundendatensatz) |
| Email | E-Mail-Adresse (zur automatischen Verknüpfung von E-Mails) |
| Phone | Telefonnummer |
| Role | Rollen-Tag |
| Level | Kontaktstufe |
| Primary Contact | Hauptansprechpartner für diesen Kunden |

### Rollen-Tags

| Rolle | Bedeutung |
|------|------|
| Decision Maker | Entscheidungsträger |
| Influencer | Beeinflusser |
| Technical | Technischer Verantwortlicher |
| Procurement | Einkaufsverantwortlicher |

![04-customers-emails-2026-04-07-01-38-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-26.png)

### E-Mail aus Kontakt heraus senden

Öffnen Sie die Detailseite des Kontakts. Ähnlich wie bei anderen Datenmanagement-Bereichen enthält sie Tabs für Details, E-Mails, Feldänderungen usw.

![04-customers-emails-2026-04-07-01-38-52](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-52.png)

---

### E-Mail- und CRM-Verknüpfung

E-Mails werden automatisch mit Kunden, Kontakten und Verkaufschancen verknüpft:

- Tab „E-Mail" in den Kundendetails → E-Mail-Verkehr mit allen Kontakten dieses Kunden
- Kontaktdetails → vollständige E-Mail-Historie dieses Kontakts
- Details zur Verkaufschance → relevante Kommunikationsaufzeichnungen

Die Verknüpfung erfolgt über Views automatisch anhand der E-Mail-Adresse des Kontakts.

![04-customers-emails-2026-04-07-01-40-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-40-26.png)

![04-customers-emails-2026-04-07-01-41-13](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-13.png)

### AI-E-Mail-Unterstützung

Die E-Mail-Seite bietet 6 AI-Unterstützungsszenarien:

| Szenario | Funktion |
|------|------|
| **Vorschlagsentwurf** | AI generiert eine Vorschlags-E-Mail basierend auf Kunden- und Verkaufschancenkontext |
| **Follow-up-E-Mail** | AI generiert Follow-up-E-Mails im passenden Tonfall |
| **E-Mail-Analyse** | AI analysiert die emotionale Tendenz und Schlüsselaussagen einer E-Mail |
| **E-Mail-Zusammenfassung** | AI erstellt eine Zusammenfassung eines E-Mail-Threads |
| **Kundenkontext** | AI fasst den Hintergrund des Kunden zusammen |
| **Executive Briefing** | AI extrahiert wichtige Informationen aus dem E-Mail-Thread und erstellt ein Briefing |

![04-customers-emails-2026-04-07-01-41-46](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-46.png)

---

## Aktivitätenprotokoll

Öffnen Sie über das obere Menü die Seite **Einstellungen → Aktivitäten**. Dies ist das zentrale Logbuch aller Kundeninteraktionen.

| Aktivitätstyp | Beschreibung |
|---------|------|
| Meeting | Besprechung |
| Call | Anruf |
| Email | E-Mail |
| Visit | Besuch |
| Note | Notiz |
| Task | Aufgabe |

![04-customers-emails-2026-04-07-01-42-20](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-42-20.png)

Aktivitäten erscheinen auch in der Kalenderansicht des Overview-Dashboards.

---

## Verwandte Seiten

- [CRM-Bedienungsanleitung](./index.md)
- [Lead-Verwaltung](./guide-leads) — Nach der Konvertierung von Leads werden Kunden und Kontakte automatisch erstellt
- [Verwaltung von Verkaufschancen](./guide-opportunities) — Mit dem Kunden verknüpfte Verkaufschancen
- [AI Employees](./guide-ai)
