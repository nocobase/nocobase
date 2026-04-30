---
title: "Produkte, Angebote und Bestellungen"
description: "CRM-Bedienungsanleitung für Produktkatalog, Angebote (inkl. Genehmigungsprozess) und Bestellverwaltung: vom Produktkatalog über die Angebotsgenehmigung bis zur Bestelllieferung."
keywords: "Produktverwaltung,Angebote,Bestellverwaltung,Genehmigungsprozess,Mehrwährung,NocoBase CRM"
---

# Produkte, Angebote und Bestellungen

> Dieses Kapitel deckt die zweite Hälfte des Verkaufsprozesses ab: Pflege des Produktkatalogs, Erstellung und Genehmigung von Angeboten sowie Auslieferung und Zahlungseingang von Bestellungen. Angebote werden auch in [Verwaltung von Verkaufschancen](./guide-opportunities) behandelt (aus Sicht der Verkaufschance), in diesem Kapitel liegt der Schwerpunkt auf der Sicht von Produkten und Bestellungen.

![cn_03-products-orders](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_03-products-orders.png)

## Produktkatalog

Öffnen Sie über das obere Menü die Seite **Produkte**, die zwei Tabs enthält:

### Produktliste

Auf der linken Seite befindet sich der Kategoriebaum (JS-Filter), auf der rechten Seite die Produkttabelle. Jedes Produkt enthält: Name, Code, Kategorie, Spezifikation, Einheit, Listenpreis, Kosten, Währung.

![03-products-orders-2026-04-07-01-18-03](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-03.png)

Beim Anlegen eines neuen Produkts können Sie zusätzlich zu den Basisinformationen auch die **Sub-Tabelle für gestaffelte Preise** konfigurieren:

| Feld | Beschreibung |
|------|------|
| Währung | Preiswährung |
| Mindestmenge | Startmenge dieser Preisstufe |
| Maximalmenge | Obergrenze dieser Preisstufe |
| Stückpreis | Stückpreis für diesen Mengenbereich |
| Rabattrate | Mengenrabatt-Prozentsatz |


![03-products-orders-2026-04-07-01-18-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-51.png)

Beim Erstellen eines Angebots passt das System nach der Auswahl des Produkts die gestaffelten Preise automatisch an die Menge an.

![03-products-orders-2026-04-07-01-19-39](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-19-39.png)

### Kategorieverwaltung

Der zweite Tab ist die Baumtabelle der Produktkategorien, die mehrstufige Kategoriehierarchien unterstützt. Klicken Sie auf „Unterkategorie hinzufügen", um unter dem aktuellen Knoten eine Unterkategorie zu erstellen.

![03-products-orders-2026-04-07-01-20-19](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-20-19.png)

---

## Angebote

Angebote werden in der Regel aus den Details einer Verkaufschance heraus erstellt (siehe Abschnitt „Angebot erstellen" in [Verkaufschancen und Angebote](./guide-opportunities)). Hier ergänzen wir Hinweise zu den Produktpositionen und zum Genehmigungsprozess.

### Produktpositionen

In der Sub-Tabelle für Angebotspositionen werden nach Auswahl des Produkts mehrere Felder automatisch ausgefüllt:

| Feld | Beschreibung |
|------|------|
| **Produkt** | Auswahl aus dem Produktkatalog |
| **Spezifikation** | Schreibgeschützt, wird nach Auswahl des Produkts automatisch ausgefüllt |
| **Einheit** | Schreibgeschützt, wird automatisch ausgefüllt |
| **Menge** | Manuelle Eingabe |
| **Listenpreis** | Schreibgeschützt, der Listenpreis aus dem Produktkatalog |
| **Stückpreis** | Schreibgeschützt, automatisch passend zur gestaffelten Preisliste |
| **Rabattrate** | Schreibgeschützt, Rabatt aus der gestaffelten Preisliste |
| **Zeilenbetrag** | Wird automatisch berechnet |

![03-products-orders-2026-04-07-01-22-22](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-22-22.gif)

Das System führt automatisch die Berechnungskette durch: Zwischensumme → Rabatt → Steuern → Versand → Gesamtbetrag → USD-Äquivalent.

![03-products-orders-2026-04-07-01-23-13](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-23-13.gif)

### Mehrwährungsunterstützung

Wenn der Kunde nicht in US-Dollar abrechnet, wählen Sie die entsprechende Währung. Das System **fixiert beim Anlegen den aktuellen Wechselkurs** und rechnet automatisch in den USD-Äquivalentbetrag um. Die Verwaltung der Wechselkurse erfolgt unter **Einstellungen → Wechselkurse**.

### Genehmigung

Nach der Erstellung eines Angebots ist eine Genehmigung erforderlich; nach erfolgreicher Genehmigung wird eine neue Bestellung angelegt.

---

## Bestellverwaltung

Öffnen Sie über das obere Menü die Seite **Bestellungen**. Sie können auch in den Details einer Verkaufschance aus einem genehmigten Angebot heraus über „New Order" direkt eine Bestellung erstellen.

### Bestellliste

Oben auf der Seite gibt es Filterschaltflächen:

| Schaltfläche | Bedeutung |
|------|------|
| **Alle** | Alle Bestellungen |
| **In Bearbeitung** | Aktuell ausgeführte Bestellungen |
| **Ausstehende Zahlung** | Wartet auf Kundenzahlung |
| **Versendet** | Versendet, wartet auf Empfangsbestätigung |
| **Abgeschlossen** | Prozess beendet |

![03-products-orders-2026-04-07-01-25-09](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-09.png)

### Spalte Bestellfortschritt

Die Spalte „Bestellfortschritt" in der Tabelle zeigt den aktuellen Status mit einem visuellen Punkt-Linien-Fortschrittsbalken an:

```
Wartet auf Bestätigung → Bestätigt → In Bearbeitung → Versendet → Abgeschlossen
```

Abgeschlossene Schritte werden hervorgehoben, noch nicht erreichte Schritte ausgegraut.

### Summenzeile

Zusammenfassende Informationen am Ende der Tabelle:

- **Beträge der ausgewählten / aller Bestellungen**
- **Verteilung des Zahlungsstatus** (als Tags)
- **Verteilung des Bestellstatus** (als Tags)

![03-products-orders-2026-04-07-01-25-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-51.png)

### Bestellung erstellen

**Vom Angebot zur Bestellung (empfohlen)**: In den Details der Verkaufschance erscheint bei einem Angebot mit Status Approved die Schaltfläche „New Order". Nach dem Klick übernimmt das System automatisch Kunde, Produktpositionen, Beträge, Währung, Wechselkurs usw.

![03-products-orders-2026-04-07-01-27-16](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-16.png)

**Manuelles Erstellen**: Klicken Sie auf der Listenseite der Bestellungen auf „Neu". Sie müssen Kunde, Produktpositionen, Bestellbetrag und Zahlungsbedingungen eingeben.

### Fortschritt des Bestellstatus

Klicken Sie auf eine Bestellung, um das Detail-Popup zu öffnen. Oben gibt es einen interaktiven Statusfluss; klicken Sie auf den nächsten Statusknoten, um den Status zu erhöhen. Jede Statusänderung wird vom System protokolliert.

![03-products-orders-2026-04-07-01-27-50](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-50.png)

### Zahlungsverfolgung

Bestellstatus und Zahlungsstatus sind zwei unabhängige Spuren:

- **Bestellstatus**: Bestätigung → Bearbeitung → Versand → Abschluss (Lieferprozess)
- **Zahlungsstatus**: Ausstehende Zahlung → Teilweise bezahlt → Bezahlt (Zahlungseingangsprozess)

Derzeit liegt unser Schwerpunkt auf dem Frontend-Prozess des CRM, ohne Bedingungseinschränkungen für den Bestellstatus, der lediglich als Aufzeichnungseintrag dient. Bei Bedarf können Sie über Verkettungsregeln und Datentabellenereignisse Steuerungen einrichten.

---

Sobald die Bestellung abgeschlossen ist, ist der gesamte Verkaufskreislauf vollständig durchlaufen. Lesen Sie weiter unter [Kunden, Kontakte und E-Mails](./guide-customers-emails) für die entsprechende Verwaltung.

## Verwandte Seiten

- [CRM-Bedienungsanleitung](./index.md)
- [Verwaltung von Verkaufschancen](./guide-opportunities) — Angebot aus Sicht der Verkaufschance
- [Kunden, Kontakte und E-Mails](./guide-customers-emails)
- [Dashboards](./guide-overview) — Drilldown der Bestelldaten
