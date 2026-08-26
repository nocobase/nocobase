---
title: "Verkaufschancen und Angebote"
description: "CRM-Bedienungsanleitung zur Verwaltung von Verkaufschancen: Kanban-Ansicht, Phasenfortschritt, Angebote erstellen, Mehrwährungsunterstützung, Genehmigungsprozess."
keywords: "Verwaltung von Verkaufschancen,Sales-Funnel,Kanban,Angebotsgenehmigung,Mehrwährung,NocoBase CRM"
---

# Verkaufschancen und Angebote

> Eine Verkaufschance bildet das Herzstück des gesamten Verkaufsprozesses – sie steht für ein potenzielles Geschäft. In diesem Kapitel lernen Sie, wie Sie mit dem Kanban die Phasen einer Verkaufschance vorantreiben, Angebote erstellen, den Genehmigungsprozess durchlaufen und das Angebot schließlich in eine offizielle Bestellung überführen.

![cn_02-opportunities](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_02-opportunities.png)

## Übersicht der Verkaufschancen-Seite

Wählen Sie im linken Menü **Sales → Opportunities**. Oben auf der Seite finden Sie zwei Tabs:

- **Pipeline-Kanban**: Zeigt alle Verkaufschancen in Kanban-Form nach Phase, geeignet für die tägliche Bearbeitung und schnelle Fortschritte.
- **Tabellenansicht**: Zeigt Verkaufschancen als Liste, geeignet für Massenfilterung und Datenexport.

Standardmäßig ist das Pipeline-Kanban geöffnet – die von Vertriebsmitarbeitern am häufigsten genutzte Ansicht.

![02-opportunities-2026-04-07-00-56-47](https://static-docs.nocobase.com/02-opportunities-2026-04-07-00-56-47.png)

## Pipeline-Kanban

### Filterleiste

Oben im Kanban befinden sich Filterschaltflächen, mit denen Sie schnell auf verschiedene Bereiche von Verkaufschancen fokussieren:

| Schaltfläche | Funktion |
|------|------|
| **All Pipeline** | Zeigt alle laufenden Verkaufschancen |
| **My Deals** | Zeigt nur die Ihnen zugewiesenen Verkaufschancen |
| **Big Deals** | Großgeschäfte mit einem Betrag ≥ $50K |
| **Closing Soon** | Verkaufschancen, die innerhalb von 30 Tagen geschlossen werden sollen |

Die Filterleiste enthält außerdem **2 Statistik-Karten** – Open Deals (Anzahl laufender Verkaufschancen) und Pipeline Value (Gesamtwert der Pipeline) – sowie ein **Echtzeit-Suchfeld**, in dem Sie nach Name der Verkaufschance, Kundenname oder Verantwortlichen schnell den gewünschten Datensatz finden.

:::tip
Diese Filterschaltflächen nutzen die Cross-Block-Verkettungsfunktion von NocoBase (`initResource` + `addFilterGroup`) und können die Daten im Kanban in Echtzeit filtern, ohne dass die Seite neu geladen werden muss.
:::

![02-opportunities-2026-04-07-01-00-37](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-00-37.gif)

### Kanban-Spalten

Das Kanban ist in **6 Spalten** unterteilt, die den 6 Phasen einer Verkaufschance entsprechen:

```
Prospecting → Analysis → Proposal → Negotiation → Won → Lost
  Erstkontakt    Bedarfsanalyse  Angebotsabgabe  Verhandlung   Gewonnen Verloren
```

Die Titelzeile jeder Spalte zeigt: Phasenname, Anzahl der Verkaufschancen in dieser Phase, Gesamtbetrag und eine Schaltfläche „+" zum schnellen Hinzufügen.

Auf jeder Karte werden folgende Informationen angezeigt:

- **Name der Verkaufschance**: z. B. „ERP-Projekt für Tech-Unternehmen XY"
- **Kundenname**: das verknüpfte Kundenunternehmen
- **Erwarteter Betrag**: z. B. $50K
- **Win-Rate**: als farbiges Tag dargestellt (grün = hohe Wahrscheinlichkeit, gelb = mittel, rot = niedrig)
- **Avatar des Verantwortlichen**: wer diese Verkaufschance betreut

### Phasenfortschritt per Drag & Drop

Die intuitivste Bedienung: **ziehen Sie die Karte einfach von einer Spalte in eine andere**, das System aktualisiert die Phase der Verkaufschance automatisch.

Wenn Sie z. B. die Bedarfsanalyse abgeschlossen haben und das Angebot vorbereiten möchten, ziehen Sie die Karte einfach von Analysis nach Proposal.

![02-opportunities-2026-04-07-01-02-09](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-02-09.gif)

## Tabellenansicht

Wechseln Sie zum Tab Tabellenansicht, dort sehen Sie eine standardmäßige Datentabelle.

### Filterschaltflächen

Oberhalb der Tabelle befindet sich ebenfalls eine Reihe von Filterschaltflächen:

- **All**: Alle Verkaufschancen
- **In Pipeline**: Laufende Verkaufschancen (ohne abgeschlossene und verlorene)
- **Closing Soon**: Stehen kurz vor dem Abschluss
- **Won**: Gewonnen
- **Lost**: Verloren

Hinter jeder Schaltfläche steht eine **Anzahlanzeige**, sodass Sie die Verteilung der Verkaufschancen auf einen Blick erkennen.

Am Ende der Tabelle gibt es eine **Summenzeile**: Sie zeigt den Gesamtbetrag der ausgewählten/aller Verkaufschancen sowie die Verteilung auf die Phasen, damit Sie sich schnell einen Überblick verschaffen können.

### Details ansehen

Klicken Sie in der Tabelle auf eine beliebige Zeile, öffnet sich das Detail-Popup der Verkaufschance – Ihre Hauptoberfläche zur Verwaltung einer einzelnen Verkaufschance.

![02-opportunities-2026-04-07-01-05-05](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-05-05.png)

## Details der Verkaufschance

Das Detail-Popup einer Verkaufschance ist die informationsdichteste Oberfläche und enthält von oben nach unten folgende Module:

![02-opportunities-2026-04-07-01-05-42](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-05-42.png)


### Phasenleiste

Oben in den Details befindet sich eine **interaktive Phasenleiste** (Steps-Komponente), die die aktuelle Phase der Verkaufschance klar anzeigt.

Sie können die Verkaufschance vorantreiben, indem Sie **direkt auf eine Phase in der Leiste klicken**. Beim Klick auf **Won** oder **Lost** öffnet sich ein Bestätigungsdialog, da diese beiden Endzustände sind und nicht leicht zurückgenommen werden können.

![02-opportunities-2026-04-07-01-06-54](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-06-54.gif)

### Wichtige Kennzahlen

Unterhalb der Phasenleiste werden vier zentrale Kennzahlen angezeigt:

| Kennzahl | Beschreibung |
|------|------|
| **Erwarteter Betrag** | Geschätzter Abschlussbetrag dieser Verkaufschance |
| **Geplantes Abschlussdatum** | Wann der Abschluss geplant ist |
| **Tage in der aktuellen Phase** | Wie lange sich die Verkaufschance bereits in der aktuellen Phase befindet (zur Identifizierung stagnierender Verkaufschancen) |
| **AI-Win-Rate** | Vom System auf Basis mehrerer Datendimensionen berechnete Abschlusswahrscheinlichkeit |

### AI-Risikoanalyse

Dies ist eine der herausragenden Funktionen des CRM. Das System analysiert automatisch den Gesundheitszustand der Verkaufschance und zeigt:

- **Win-Rate-Ringdiagramm**: Anschauliche Darstellung der Abschlusswahrscheinlichkeit
- **Liste der Risikofaktoren**: z. B. „Letzter Kundenkontakt vor mehr als 14 Tagen" oder „Wettbewerber mit niedrigerem Angebot"
- **Empfohlene Aktion**: Vorschlag der AI für den nächsten Schritt, z. B. „Eine Produktdemo arrangieren"


### Angebotsliste
![02-opportunities-2026-04-07-01-16-19](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-16-19.png)
Im mittleren Bereich der Details werden **alle mit dieser Verkaufschance verknüpften Angebote** als Sub-Tabelle dargestellt. Jede Zeile zeigt Angebotsnummer, Betrag, Status und weitere Informationen; der Genehmigungsstatus wird mit visuellen Tags angezeigt (Entwurf, in Genehmigung, genehmigt, abgelehnt).

### Kommentare und Anhänge

Auf der rechten Seite der Details befinden sich der Kommentarbereich und der Anhangsbereich, in denen Teammitglieder Fortschritte austauschen und relevante Dateien hochladen können.
![02-opportunities-2026-04-07-01-17-01](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-17-01.png)

## Angebot erstellen

Bereit, dem Kunden ein Angebot zu unterbreiten? Der Ablauf ist wie folgt:

**Schritt 1**: Öffnen Sie die Details der Verkaufschance und navigieren Sie zur Angebotsliste.

**Schritt 2**: Klicken Sie auf die Schaltfläche **Add new** (Neu hinzufügen). Das System öffnet das Angebotsformular.

**Schritt 3**: Geben Sie die grundlegenden Angebotsinformationen ein, einschließlich Angebotsname, Gültigkeitsdauer usw.

**Schritt 4**: Fügen Sie in der **Sub-Tabelle für Produktpositionen** Angebotszeilen hinzu:

| Feld | Beschreibung |
|------|------|
| **Produkt** | Auswahl aus dem Produktkatalog |
| **Spezifikation** | Schreibgeschützt, wird nach Auswahl des Produkts automatisch ausgefüllt |
| **Einheit** | Schreibgeschützt, wird automatisch ausgefüllt |
| **Menge** | Angebotsmenge |
| **Listenpreis** | Schreibgeschützt, der Listenpreis aus dem Produktkatalog |
| **Stückpreis** | Schreibgeschützt, automatisch passend zur gestaffelten Preisliste |
| **Rabattrate** | Schreibgeschützt, Rabatt aus der gestaffelten Preisliste |
| **Zeilenbetrag** | Wird automatisch berechnet |

Das System führt automatisch die Berechnungskette durch: Zwischensumme → Rabatt → Steuern → Versand → Gesamtbetrag → USD-Äquivalent. Im Formular gibt es einen JS-Hinweisblock, der die Auto-Fill-Regeln und Berechnungsformeln anzeigt.

**Schritt 5**: Wenn der Kunde nicht in US-Dollar abrechnet, wählen Sie die entsprechende Währung. Das System **fixiert beim Anlegen den aktuellen Wechselkurs** und rechnet automatisch in den USD-Äquivalentbetrag um, sodass spätere Abstimmungen nicht von Wechselkursschwankungen beeinflusst werden.

**Schritt 6**: Wenn die Informationen korrekt sind, klicken Sie auf Speichern, um das Angebot zu sichern. Das Angebot hat nun den Status **Draft (Entwurf)**.

![02-opportunities-2026-04-07-01-09-11](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-09-11.gif)

## Genehmigungsprozess für Angebote

Ein erstelltes Angebot wird nicht sofort wirksam – es muss einen Genehmigungsprozess durchlaufen, der sicherstellt, dass das Angebot angemessen und der Rabatt im autorisierten Rahmen ist.

### Übersicht des Genehmigungsprozesses

```
Draft (Entwurf) → Pending Approval (Wartet auf Genehmigung) → Manager Review (Manager-Prüfung) → Approved / Rejected / Returned
```

![02-opportunities-2026-04-07-01-09-38](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-09-38.png)

### Zur Genehmigung einreichen

**Schritt 1**: Suchen Sie in den Details der Verkaufschance ein Angebot mit dem Status Draft und klicken Sie auf die Schaltfläche **Submit for Approval** (Zur Genehmigung einreichen).

:::note
Diese Schaltfläche **ist nur sichtbar, wenn das Angebot den Status Draft hat**. Bereits eingereichte oder genehmigte Angebote zeigen diese Schaltfläche nicht an.
:::

**Schritt 2**: Das System aktualisiert den Status des Angebots automatisch auf **Pending Approval** und löst den Genehmigungs-Workflow aus.

**Schritt 3**: Der zugewiesene Genehmigungsmanager erhält im System eine Benachrichtigung über die Genehmigungsaufgabe.

![02-opportunities-2026-04-07-01-12-20](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-12-20.png)

### Manager-Genehmigung

Wenn der Genehmigungsmanager die Genehmigungsaufgabe öffnet, sieht er folgende Inhalte:

**Genehmigungskarte**: Zeigt die wichtigsten Angebotsinformationen – Angebotsnummer, Name, Betrag (Lokalwährung + USD-Äquivalent), aktueller Status.

**Genehmigungsdetails**: Zeigt den Inhalt des Angebots schreibgeschützt vollständig an, einschließlich:
- Grundinformationen (Angebotsname, Gültigkeitsdauer, Währung)
- Verknüpfung mit Kunde und Verkaufschance
- Sub-Tabelle der Produktpositionen (Produkt, Menge, Stückpreis, Rabatt, Zwischensumme)
- Gesamtbetrag
- Bedingungen und Anmerkungen

**Aktionsschaltflächen**: Der Genehmigungsmanager kann folgende Aktionen ausführen:

| Aktion | Effekt |
|------|------|
| **Approve (Genehmigen)** | Angebotsstatus wechselt zu Approved |
| **Reject (Ablehnen)** | Angebotsstatus wechselt zu Rejected, Begründung erforderlich |
| **Return (Zurücksenden)** | Angebot wird zur Bearbeitung an den Ersteller zurückgesendet, Status wechselt zurück zu Draft |
| **Add Approver (Genehmiger hinzufügen)** | Einen weiteren Genehmiger hinzufügen |
| **Transfer (Weiterleiten)** | Genehmigungsaufgabe an eine andere Person übergeben |

![02-opportunities-2026-04-07-01-13-04](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-13-04.png)

### Verarbeitung der Genehmigungsergebnisse

- **Genehmigt**: Angebotsstatus wechselt zu Approved und kann zum nächsten Schritt – der Umwandlung in eine offizielle Bestellung – übergeben werden.
- **Abgelehnt / Zurückgesendet**: Angebotsstatus wechselt zurück zu Draft, der Ersteller kann es bearbeiten und erneut zur Genehmigung einreichen.

![02-opportunities-2026-04-07-01-13-25](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-13-25.png)

## Angebot in Bestellung umwandeln

Wenn das Angebot den Status **Approved (Genehmigt)** hat, sehen Sie im Aktionsbereich des Angebots eine Schaltfläche **New Order** (Bestellung erstellen).

:::note
Diese Schaltfläche **ist nur sichtbar, wenn das Angebot den Status Approved hat**. Entwürfe oder in Genehmigung befindliche Angebote zeigen diese Schaltfläche nicht an.
:::

Klicken Sie auf **New Order**, und das System erstellt automatisch einen Bestellentwurf basierend auf den Daten des Angebots, einschließlich Produktpositionen, Beträgen, Kundeninformationen usw., um doppelte Eingaben zu vermeiden.

![02-opportunities-2026-04-07-01-14-41](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-14-41.png)

---

Sobald das Angebot den Genehmigungsprozess durchlaufen hat, kann es in eine offizielle Bestellung umgewandelt werden. Lesen Sie weiter unter [Bestellverwaltung](./guide-products-orders), um die nachfolgenden Schritte zu verstehen.

## Verwandte Seiten

- [CRM-Bedienungsanleitung](./index.md)
- [Lead-Verwaltung](./guide-leads)
- [Bestellverwaltung](./guide-products-orders)
