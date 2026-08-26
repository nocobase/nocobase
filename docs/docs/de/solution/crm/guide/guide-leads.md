---
title: "Lead-Verwaltung"
description: "CRM Lead-Bedienungsanleitung: Leads erstellen, automatisches AI-Scoring, intelligentes Filtern, Konvertierung von Leads in Kunden und Verkaufschancen."
keywords: "Lead-Verwaltung,Lead,AI-Scoring,Lead-Konvertierung,Sales-Funnel,NocoBase CRM"
---

# Lead-Verwaltung

> Ein Lead ist der Ausgangspunkt des Verkaufsprozesses – jeder erste Kontakt mit einem potenziellen Kunden beginnt hier. Dieses Kapitel führt Sie durch den vollständigen Lebenszyklus eines Leads: Erstellen, Bewerten, Filtern, Nachverfolgen und Konvertieren.

![cn_01-leads](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_01-leads.png)

## Übersicht der Lead-Seite

Klicken Sie im oberen Menü auf **Sales → Leads**, um die Seite zur Lead-Verwaltung zu öffnen.

![01-leads-2026-04-02-00-04-18](https://static-docs.nocobase.com/01-leads-2026-04-02-00-04-18.png)

Oben auf der Seite befindet sich eine Reihe von **intelligenten Filterschaltflächen**, mit denen Sie schnell zwischen Ansichten wechseln können:

Erste Gruppe:

| Schaltfläche | Beschreibung |
|------|------|
| All | Alle Leads anzeigen |
| New | Neu erstellt, noch nicht in Bearbeitung |
| Working | In Bearbeitung |
| Qualified | Als qualifizierter Lead bestätigt |
| Unqualified | Als nicht qualifiziert markiert |

Zweite Gruppe:

| Tag | Bedeutung |
|------|------|
| 🔥 Hot | Leads mit AI-Score ≥ 75 |
| Heute | Heute erstellte Leads |
| Diese Woche | In dieser Woche erstellte Leads |
| Diesen Monat | In diesem Monat erstellte Leads |
| Nicht zugewiesen | Leads ohne Owner |
| Großunternehmen | Leads aus Enterprise-Quellen |


![01-leads-2026-04-02-00-06-19](https://static-docs.nocobase.com/01-leads-2026-04-02-00-06-19.gif)


Die Tabelle ermöglicht einen schnellen Überblick über die wichtigsten Informationen und enthält folgende kombinierte Spalten:

- **AI-Score-Anzeige**: Kreisförmige Anzeige von 0–100 Punkten, rot (niedrig) → gelb (mittel) → grün (hoch), zeigt die Qualität des Leads auf einen Blick
- **Kombinierte Spalte Name+Unternehmen**: Name und Unternehmensname zusammen angezeigt, um Platz zu sparen
- **Kombinierte Spalte E-Mail+Telefon**: Kontaktdaten auf einen Blick
- **Spalte mit relativer Zeit**: Zeigt „vor 3 Stunden", „vor 2 Tagen" usw. an. Überfällige Leads werden rot hervorgehoben, um Sie an die rechtzeitige Bearbeitung zu erinnern

![01-leads-2026-04-02-00-07-04](https://static-docs.nocobase.com/01-leads-2026-04-02-00-07-04.gif)

## Lead erstellen

Klicken Sie oberhalb der Tabelle auf die Schaltfläche **Add new**, um das Formular zum Anlegen eines neuen Leads zu öffnen.

![01-leads-2026-04-02-00-08-08](https://static-docs.nocobase.com/01-leads-2026-04-02-00-08-08.png)

Geben Sie folgende Informationen ein:

| Feld | Beschreibung | Pflichtfeld |
|------|------|---------|
| Name | Name des Leads | ✅ |
| Company | Unternehmen | empfohlen |
| Email | E-Mail-Adresse | empfohlen |
| Phone | Telefonnummer | empfohlen |
| Source | Lead-Quelle (z. B. Webformular, Messe, Empfehlung usw.) | empfohlen |
...

### Echtzeit-Duplikatsprüfung

Während Sie das Formular ausfüllen, prüft das System die Felder Name, Unternehmen, E-Mail, Telefon und Mobilnummer in Echtzeit auf Duplikate. Wenn bei der Eingabe ein passender Datensatz gefunden wird:

- **Gelbe Warnung**: Ähnlicher Datensatz gefunden, bitte verifizieren
- **Rote Warnung**: Vollständig identischer Datensatz gefunden, dringende Empfehlung, zuerst den vorhandenen Datensatz zu prüfen

![01-leads-2026-04-02-00-11-05](https://static-docs.nocobase.com/01-leads-2026-04-02-00-11-05.png)


Dies verhindert effektiv, dass dieselbe Person mehrfach erfasst wird.

### AI-Formularausfüllung

Wenn Ihnen ein Visitenkartentext oder eine Konversationsaufzeichnung vorliegt, müssen Sie nicht jedes Feld manuell ausfüllen – klicken Sie auf die AI-Schaltfläche, wählen Sie „Formularausfüllung", fügen Sie den Text ein, und die AI extrahiert automatisch Name, Unternehmen, E-Mail, Telefonnummer usw. und füllt das Formular auf einen Klick aus.

Klicken Sie nach dem Ausfüllen auf **Submit**, um zu speichern.

![01-leads-2026-04-02-00-15-14](https://static-docs.nocobase.com/01-leads-2026-04-02-00-15-14.png)

### Automatisches AI-Scoring

Nach dem Speichern löst das System automatisch den **AI-Scoring-Workflow** aus. Die AI analysiert alle Informationen des Leads und erzeugt folgende Ergebnisse:

| AI-Ausgabe | Beschreibung |
|---------|------|
| Score | Gesamtbewertung von 0–100 |
| Conversion Probability | Prognostizierte Konvertierungswahrscheinlichkeit |
| NBA (Empfohlene nächste Aktion) | Empfehlung der AI für den nächsten Schritt, z. B. „Innerhalb von 24 Stunden anrufen" |
| Tags | Automatisch generierte Tags wie „Hohe Kaufabsicht", „Entscheidungsträger" usw. |

![01-leads-2026-04-02-00-15-53](https://static-docs.nocobase.com/01-leads-2026-04-02-00-15-53.png)

> 💡 **Hinweis**: Je höher der AI-Score, desto besser die Lead-Qualität. Wir empfehlen, sich vorrangig auf Hot Leads (≥ 75 Punkte) zu konzentrieren und die Energie auf die Kunden mit der höchsten Abschlusswahrscheinlichkeit zu verwenden.

## Filtern und Suchen

Die intelligenten Filterschaltflächen oben unterstützen **Echtzeit-Filterung** – ein Klick reicht aus, ohne dass die Seite neu geladen werden muss.

Einige typische Anwendungsfälle:

- **Morgens zur Arbeit**: Klicken Sie auf „Heute", um die heute neu eingegangenen Leads zu sehen, dann auf „Hot", um zu prüfen, ob es hoch bewertete Leads gibt, die sofort bearbeitet werden müssen
- **Leads zuweisen**: Klicken Sie auf „Nicht zugewiesen", um Leads ohne Owner zu finden, und weisen Sie sie nacheinander den Vertriebskolleginnen und -kollegen zu
- **Rückblickender Filter**: Klicken Sie auf „Unqualified", um die als nicht qualifiziert markierten Leads zu überprüfen und nach Fehleinschätzungen zu suchen

> 💡 **Hinweis**: Das System unterstützt direktes Filtern über URL-Parameter. Wenn Sie die Lead-Seite z. B. mit `?status=new` aufrufen, wird automatisch die Schaltfläche „New" ausgewählt. Das ist praktisch, wenn Sie von anderen Seiten dorthin springen.

## Lead-Details

Klicken Sie in der Tabelle auf einen beliebigen Lead, um das Detail-Popup zu öffnen. Es enthält **3 Tabs**:

### Detail-Tab

Dies ist der informationsreichste Tab und enthält von oben nach unten:

![01-leads-2026-04-02-00-17-36](https://static-docs.nocobase.com/01-leads-2026-04-02-00-17-36.png)

**Phasenfortschritt und Aktionsschaltflächen**

Der obere Bereich enthält die Phasenleiste und Aktionsschaltflächen (Edit / Convert / Lost / Assign). Die Phasenleiste:

```
New → Working → Converted / Lost
```

Sie können den Status des Leads vorantreiben, indem Sie **direkt auf die entsprechende Phase klicken**. Klicken Sie z. B. auf „Working", wenn Sie mit der Bearbeitung beginnen, oder auf „Converted", um den Konvertierungsprozess auszulösen, sobald der Lead als qualifiziert bestätigt ist.

![01-leads-2026-04-02-00-23-03](https://static-docs.nocobase.com/01-leads-2026-04-02-00-23-03.png)

Wenn das Zielobjekt (Kunde, Kontakt, Verkaufschance) bereits existiert, suchen und wählen Sie es direkt aus. Andernfalls klicken Sie rechts neben dem Eingabefeld auf die Schaltfläche zum Erstellen, um ein neues Popup zu öffnen, in dem die mit dem Lead verbundenen Inhalte automatisch ausgefüllt werden.
![01-leads-2026-04-07-00-14-21](https://static-docs.nocobase.com/01-leads-2026-04-07-00-14-21.gif)


Beim Klick auf „Lost" öffnet sich ein Dialog, in dem Sie den Verlustgrund eintragen können – das erleichtert die spätere Analyse.

![01-leads-2026-04-02-00-23-25](https://static-docs.nocobase.com/01-leads-2026-04-02-00-23-25.png)


**AI-Score-Karte**

Zeigt die Details des AI-Scores an, einschließlich:
- AI-Score-Anzeige (0–100)
- Conversion Probability (Konvertierungswahrscheinlichkeit)
- Pipeline Days (Tage in der Pipeline)
- NBA (Empfohlene nächste Aktion)

**Bereich mit Tag-Badges**

Zeigt mit farbigen Badges Schlüsselattribute wie Rating (Bewertung), Status (Status) und Source (Quelle) an.

**Grundinformationen und Schnellschaltflächen für Aktivitäten**

Unternehmensinformationen, Kontaktdaten und weitere Basisfelder. In diesem Bereich gibt es außerdem eine Reihe von Schnellschaltflächen für Aktivitäten: Log Call (Anruf protokollieren), Send Email (E-Mail senden), Schedule (Termin erstellen). Die Aktion wird automatisch dem aktuellen Lead zugeordnet.

**AI Insights**

Von der AI generierte Analyseerkenntnisse und Nachverfolgungsempfehlungen.

**Kommentarbereich**

Teammitglieder können hier diskutieren. Alle Kommentare werden nach der Konvertierung des Leads automatisch in den neu erstellten Kundendatensatz übernommen.

![01-leads-2026-04-02-00-24-10](https://static-docs.nocobase.com/01-leads-2026-04-02-00-24-10.png)

### E-Mail-Tab

Zeigt den gesamten E-Mail-Verkehr im Zusammenhang mit diesem Lead, sodass Sie die Kommunikationshistorie nachvollziehen können. Sie können von hier aus direkt E-Mails senden und finden auch AI-Unterstützungsschaltflächen.

![01-leads-2026-04-02-00-17-57](https://static-docs.nocobase.com/01-leads-2026-04-02-00-17-57.png)

### Tab Änderungshistorie

Zeichnet alle Feldänderungen dieses Leads präzise auf: „Wer hat wann welches Feld von A auf B geändert". Dient der Nachverfolgung und Analyse.

![01-leads-2026-04-02-00-22-07](https://static-docs.nocobase.com/01-leads-2026-04-02-00-22-07.png)


## Lead-Konvertierung

Dies ist der **wichtigste Vorgang** in der Lead-Verwaltung – ein qualifizierter Lead wird mit einem Klick in einen Kunden, einen Kontakt und eine Verkaufschance umgewandelt.

### So konvertieren Sie

Klicken Sie im Detail-Popup des Leads in der Phasenleiste auf die Phase **Converted**.

![01-leads-2026-04-02-00-26-01](https://static-docs.nocobase.com/01-leads-2026-04-02-00-26-01.png)

### Konvertierungsablauf

Das System löst automatisch den **Lead-Konvertierungs-Workflow** aus, der die folgenden Aktionen in einem Schritt ausführt:

1. **Kunde erstellen (Customer)** – Ein neuer Kundendatensatz wird mit dem Unternehmensnamen des Leads angelegt; Name/Branche/Größe/Adresse werden automatisch aus dem Lead übernommen, mit Duplikatsprüfung
2. **Kontakt erstellen (Contact)** – Ein Kontakt wird mit Name, E-Mail, Telefon und Position des Leads erstellt und mit dem Kunden verknüpft
3. **Verkaufschance erstellen (Opportunity)** – Eine neue Verkaufschance wird angelegt; Name/Quelle/Betrag/Phase werden automatisch aus dem Lead übernommen und mit dem Kunden verknüpft
4. **Kommentare migrieren** – Alle Kommentare des Leads werden automatisch auf die neu erstellten Datensätze kopiert
5. **Lead-Status aktualisieren** – Der Lead-Status wird auf Qualified gesetzt

### Effekt nach der Konvertierung

Nach der Konvertierung sehen Sie in der Lead-Liste, dass die **kombinierte Spalte Name+Unternehmen** zu klickbaren Links geworden ist:

- Klick auf den Namen → Sprung zu den Kontaktdetails
- Klick auf den Unternehmensnamen → Sprung zu den Kundendetails

![01-leads-2026-04-02-00-26-36](https://static-docs.nocobase.com/01-leads-2026-04-02-00-26-36.png)

> 💡 **Hinweis**: Die Konvertierung ist eine nicht umkehrbare Operation. Stellen Sie vor der Konvertierung sicher, dass die Lead-Informationen korrekt und vollständig sind, insbesondere Unternehmensname und Kontaktdaten – diese werden direkt zu den Anfangsdaten des Kunden und des Kontakts.

## Automatische Zuweisung

Wenn ein Lead keinen Owner hat, löst das System automatisch den **Lead-Zuweisungs-Workflow** aus.

Die Logik ist einfach: **Automatische Zuweisung an die Vertriebsmitarbeiterin bzw. den Vertriebsmitarbeiter mit den derzeit wenigsten Leads**, um eine ausgewogene Arbeitslast im Team sicherzustellen.

Dieser Workflow prüft sowohl beim Erstellen als auch beim Aktualisieren des Leads – wenn das Owner-Feld leer ist, erfolgt die automatische Zuweisung.

> 💡 **Hinweis**: Wenn Sie den Owner manuell festlegen möchten, bearbeiten Sie das Owner-Feld einfach in den Details. Eine manuelle Zuweisung überschreibt das Ergebnis der automatischen Zuweisung.

---

Nach Abschluss der Lead-Konvertierung sind Ihre Kunden und Verkaufschancen bereit. Sehen Sie sich nun unter [Verkaufschancen und Angebote](./guide-opportunities) an, wie Sie den Sales-Funnel vorantreiben.

## Verwandte Seiten

- [Übersicht der CRM-Bedienungsanleitung](./index.md)
- [Verkaufschancen und Angebote](./guide-opportunities)
- [Kundenverwaltung](./guide-customers-emails)
