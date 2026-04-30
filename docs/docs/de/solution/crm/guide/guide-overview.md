---
title: "Systemeinführung und Dashboards"
description: "CRM 2.0 Systemüberblick: Menüstruktur, Mehrsprachigkeit und Themes, Analytics-Dashboard, Overview-Arbeitsbereich."
keywords: "CRM-Einführung,Dashboard,Datenanalyse,KPI,NocoBase CRM"
---

# Systemeinführung und Dashboards

> Dieses Kapitel stellt zwei Dashboards vor: Analytics (Datenanalyse) und Overview (Tagesarbeitsbereich).

## Systemüberblick

CRM 2.0 ist ein vollständiges Vertriebsmanagementsystem, das den gesamten Prozess von der Lead-Gewinnung bis zur Auslieferung der Bestellung abdeckt. Nach der Anmeldung dient die obere Menüleiste als Hauptnavigation.


### Mehrsprachigkeit und Themes

Das System unterstützt das Umschalten zwischen mehreren Sprachen (oben rechts), und alle JS-Blocks und Diagramme sind mehrsprachig angepasst.

In Bezug auf Themes werden sowohl helle als auch dunkle Themes unterstützt, wir empfehlen jedoch derzeit den **hellen Theme + den kompakten Modus** für eine höhere Informationsdichte. Einige Anzeigeprobleme im dunklen Theme werden in zukünftigen Versionen behoben.

![00-overview-2026-04-01-23-38-28](https://static-docs.nocobase.com/00-overview-2026-04-01-23-38-28.png)

---

## Analytics — Zentrum für Datenanalyse

Analytics ist die erste Seite in der Menüleiste und auch die erste Oberfläche, die Sie täglich beim Öffnen des Systems sehen.

### Globale Filter

Oben auf der Seite gibt es eine Filterleiste mit zwei Filterkriterien: **Datumsbereich** und **Verantwortliche/r (Owner)**. Nach dem Filtern werden alle KPI-Karten und Diagramme auf der Seite synchron aktualisiert.

![00-overview-2026-04-01-23-40-45](https://static-docs.nocobase.com/00-overview-2026-04-01-23-40-45.png)


### KPI-Karten

Unterhalb der Filterleiste befinden sich 4 KPI-Karten:

| Karte | Bedeutung | Klickverhalten |
|------|------|---------|
| **Gesamtumsatz** | Kumulierter Einnahmebetrag | Popup: Tortendiagramm Zahlungsstatus + Trend des Monatsumsatzes |
| **Neue Leads** | Anzahl neuer Leads im Zeitraum | Sprung zur Lead-Seite mit automatischer Filterung „New" |
| **Konvertierungsrate** | Verhältnis von Lead zu Abschluss | Popup: Tortendiagramm Phasenverteilung + Säulendiagramm Beträge |
| **Durchschnittlicher Abschlusszyklus** | Durchschnittliche Tage von der Erstellung bis zum Abschluss | Popup: Verteilung des Zyklus + Trend monatlicher Gewinngeschäfte |

Jede Karte ist **anklickbar mit Drilldown** – im Popup werden detailliertere Analysediagramme angezeigt. Wenn Sie weiter anpassen möchten, können Sie noch tiefer in die Daten eintauchen (Unternehmen → Abteilung → Einzelperson).

![00-overview-2026-04-01-23-42-33](https://static-docs.nocobase.com/00-overview-2026-04-01-23-42-33.gif)

:::tip[Weniger Daten nach dem Sprung?]
Wenn Sie von einem KPI auf eine Listenseite springen, hängt die URL Filterparameter an (z. B. `?status=new`). Wenn Sie feststellen, dass die Listendaten weniger geworden sind, liegt das daran, dass dieser Parameter noch wirksam ist. Kehren Sie zum Dashboard zurück und öffnen Sie die Listenseite erneut, um die vollständigen Daten wiederherzustellen.
:::

![00-overview-2026-04-01-23-44-19](https://static-docs.nocobase.com/00-overview-2026-04-01-23-44-19.png)


### Diagrammbereich

Unterhalb der KPIs befinden sich 5 zentrale Diagramme:

| Diagramm | Typ | Beschreibung | Klickverhalten |
|------|------|------|---------|
| **Phasenverteilung der Verkaufschancen** | Säulendiagramm | Anzahl, Betrag und gewichtete Wahrscheinlichkeit jeder Phase | Popup: dreidimensionaler Drilldown nach Kunde/Verantwortlichem/Monat |
| **Sales-Funnel** | Trichterdiagramm | Konvertierung Lead → Opportunity → Quotation → Order | Klick führt zur jeweiligen Entitätsseite |
| **Monatlicher Verkaufstrend** | Säule + Linie | Monatsumsatz, Bestellanzahl, Durchschnittspreis pro Bestellung | Sprung zur Orders-Seite (mit Monatsparameter) |
| **Trend des Kundenwachstums** | Säule + Linie | Neue Kunden pro Monat, kumulierte Kunden | Sprung zur Customers-Seite |
| **Branchenverteilung** | Tortendiagramm | Verteilung der Kunden nach Branche | Sprung zur Customers-Seite |

![00-overview-2026-04-01-23-46-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-46-36.png)

#### Sales-Funnel

Zeigt die Konvertierungsraten der vollständigen Pipeline Lead → Opportunity → Quotation → Order. Jede Ebene ist anklickbar und führt zur Listenseite der entsprechenden Entität (z. B. Klick auf die Opportunity-Ebene → Sprung zur Liste der Verkaufschancen).

#### Monatlicher Verkaufstrend

Das Säulendiagramm zeigt den monatlichen Umsatz, die Linie überlagert Bestellanzahl und Durchschnittspreis pro Bestellung. Klicken Sie auf eine Monatssäule → Sprung zur Orders-Seite mit automatischer Zeitfilterung dieses Monats (z. B. `?month=2026-02`), um die Bestelldetails dieses Monats direkt einzusehen.

#### Trend des Kundenwachstums

Das Säulendiagramm zeigt die monatlichen Neukunden, die Linie zeigt die kumulierte Gesamtkundenzahl. Klicken Sie auf eine Monatssäule → Sprung zur Customers-Seite mit Filter auf die in diesem Monat neu hinzugekommenen Kunden.

#### Branchenverteilung

Das Tortendiagramm zeigt die Verteilung der Kunden nach Branche und die zugehörigen Bestellbeträge. Klicken Sie auf einen Branchensektor → Sprung zur Customers-Seite mit Filter auf die Kunden dieser Branche.

### Drilldown der Verkaufschancenphasen

Wenn Sie auf eine Säule der Phasenverteilung klicken, öffnet sich eine vertiefte Analyse dieser Phase:

- **Monatlicher Trend**: Veränderungen der Verkaufschancen dieser Phase im Monatsverlauf
- **Nach Verantwortlichem**: Wer betreut diese Verkaufschancen
- **Nach Kunde**: Welche Kunden haben Verkaufschancen in dieser Phase
- **Summenzeile unten**: Wenn Sie Kunden auswählen, sehen Sie den kumulierten Betrag

![00-overview-2026-04-01-23-49-04](https://static-docs.nocobase.com/00-overview-2026-04-01-23-49-04.png)


Der Drilldown-Inhalt jeder Phase (Prospecting / Analysis / Proposal / Negotiation / Won / Lost) unterscheidet sich und spiegelt die Schwerpunkte der jeweiligen Phase wider.

Die zentrale Frage, die dieses Diagramm beantwortet, lautet: **In welcher Phase verliert der Funnel am meisten?** Wenn sich z. B. in der Proposal-Phase viele Verkaufschancen anstauen, aber nur wenige in die Negotiation-Phase übergehen, deutet dies darauf hin, dass es in der Angebotsphase Probleme gibt.

![00-overview-2026-04-01-23-48-21](https://static-docs.nocobase.com/00-overview-2026-04-01-23-48-21.gif)

### Diagrammkonfiguration (Erweitert)

Hinter jedem Diagramm stehen drei Konfigurationsdimensionen:

1. **SQL-Datenquelle**: Bestimmt, welche Daten das Diagramm anzeigt; Sie können die Abfrage im SQL-Builder ausführen und überprüfen
2. **Diagrammstil**: JSON-Konfiguration im Custom-Bereich, der das Erscheinungsbild des Diagramms steuert
3. **Ereignisse**: Verhalten beim Klicken (Popup OpenView / Seitensprung)

![00-overview-2026-04-01-23-51-00](https://static-docs.nocobase.com/00-overview-2026-04-01-23-51-00.png)


### Filterverkettung

Wenn Sie ein beliebiges Kriterium in der oberen Filterleiste ändern, werden **alle KPI-Karten und Diagramme der Seite gleichzeitig aktualisiert**, ohne dass jedes einzelne eingestellt werden muss. Typische Anwendungsfälle:

- **Performance einer Person ansehen**: Owner auf „Zhang San" setzen → die gesamten Seitendaten wechseln zu den Leads, Verkaufschancen und Bestellungen, für die Zhang San verantwortlich ist
- **Zeiträume vergleichen**: Datum von „Diesen Monat" auf „Dieses Quartal" wechseln → der Bereich der Trenddiagramme ändert sich entsprechend

Die Verkettung von Filterleiste und Diagrammen wird durch den **Seiten-Eventflow** umgesetzt – vor dem Rendern werden Formularvariablen injiziert, und die Diagramme referenzieren über Variablen die Filterwerte im SQL.

![00-overview-2026-04-01-23-52-29](https://static-docs.nocobase.com/00-overview-2026-04-01-23-52-29.png)

![00-overview-2026-04-01-23-53-57](https://static-docs.nocobase.com/00-overview-2026-04-01-23-53-57.png)
:::note
SQL-Templates unterstützen derzeit nur die `if`-Syntax für Bedingungsentscheidungen. Wir empfehlen, sich an den im System bereits vorhandenen Templates zu orientieren oder die AI bei der Anpassung helfen zu lassen.
:::

---

## Overview — Tagesarbeitsbereich

Overview ist die zweite Dashboard-Seite und ist eher auf die tägliche Arbeit als auf Datenanalyse ausgerichtet. Sie beantwortet die zentrale Frage: **Was sollte ich heute tun? Welche Leads lohnen sich für eine Nachverfolgung?**

![00-overview-2026-04-01-23-56-07](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-07.png)


### Hochbewertete Leads

Filtert automatisch Leads mit AI-Score ≥ 75 und Status New / Working (Top 5). Für jeden Eintrag werden angezeigt:

- **AI-Score-Anzeige**: Eine Kreisanzeige zeigt die Lead-Qualität intuitiv (grün = hoher Score = vorrangige Bearbeitung lohnt sich)
- **AI-Empfehlung der nächsten Aktion**: Die vom System anhand der Lead-Merkmale automatisch vorgeschlagene Folgemaßnahme (z. B. „Schedule a demo")
- **Lead-Basisinformationen**: Name, Unternehmen, Quelle, Erstellungszeit

Klicken Sie auf den Lead-Namen, um die Details zu öffnen, oder auf „Alle anzeigen", um zur Lead-Listenseite zu wechseln. Ein Blick auf diese Tabelle jeden Morgen genügt, um zu wissen, wen Sie heute vorrangig kontaktieren sollten.

![00-overview-2026-04-01-23-56-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-36.png)

### Heutige Aufgaben

Die Aktivitätenliste des Tages (Besprechungen, Anrufe, Aufgaben usw.) bietet:

- **Mit einem Klick erledigen**: Klicken Sie auf „Done", um eine Aufgabe als erledigt zu markieren – nach Abschluss wird sie ausgegraut
- **Erinnerung an Überfälligkeit**: Nicht erledigte überfällige Aufgaben werden rot hervorgehoben
- **Details ansehen**: Klicken Sie auf den Aufgabennamen, um die Details zu öffnen
- **Neue Aufgabe erstellen**: Direkt hier eine neue Aktivität anlegen

![00-overview-2026-04-01-23-57-09](https://static-docs.nocobase.com/00-overview-2026-04-01-23-57-09.png)

### Aktivitätskalender

FullCalendar-Kalenderansicht, farblich nach Aktivitätstyp differenziert (Besprechung/Anruf/Aufgabe/E-Mail/Notiz). Unterstützt Monats-/Wochen-/Tagesansicht, Termine können per Drag & Drop verschoben werden, und ein Klick öffnet die Details.

![00-overview-2026-04-01-23-58-02](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-02.gif)

---

## Weitere Dashboards (More Charts)

Im Menü gibt es drei weitere Dashboards für unterschiedliche Rollen, die nur als Referenz dienen und je nach Bedarf beibehalten oder ausgeblendet werden können:

| Dashboard | Zielnutzer | Merkmale |
|--------|---------|------|
| **SalesManager** | Sales Manager | Team-Ranking, Risiko-Streudiagramm, Monatsziele |
| **SalesRep** | Sales Rep | Daten werden automatisch nach dem aktuellen Benutzer gefiltert, sodass nur die eigene Performance sichtbar ist |
| **Executive** | Executive | Umsatzprognosen, Kundengesundheit, Win/Loss-Trends |

![00-overview-2026-04-01-23-58-39](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-39.png)

Nicht benötigte Dashboards können im Menü ausgeblendet werden, ohne die Funktionalität des Systems zu beeinträchtigen.

![00-overview-2026-04-02-00-02-39](https://static-docs.nocobase.com/00-overview-2026-04-02-00-02-39.png)

---

## KPI-Drilldown (Drill-through)

Sie haben vielleicht schon bemerkt, dass nahezu jede Zahl und jedes Diagramm oben „anklickbar" ist. Dies ist das zentrale Interaktionsmuster im CRM – **KPI-Drilldown**: Klicken Sie auf eine aggregierte Zahl → Sie sehen die zugrunde liegenden Detaildaten.

Der Drilldown gibt es in zwei Formen:

| Form | Anwendungsbereich | Beispiel |
|------|---------|------|
| **Popup-Drilldown** | Mehrdimensionale Vergleichsanalyse | Klick auf „Gesamtumsatz" → Popup zeigt Tortendiagramm + Trend |
| **Seitensprung** | Detaildaten ansehen und bearbeiten | Klick auf „Neue Leads" → Sprung zur Leads-Liste |

**Beispielszenario**: Im Diagramm „Monatlicher Verkaufstrend" in Analytics fällt Ihnen auf, dass die Säule für Februar deutlich niedriger ist als die anderen → klicken Sie auf diese Säule → das System springt zur Orders-Seite und filtert automatisch nach `Monat = 2026-02` → Sie sehen direkt alle Bestelldetails des Februars und können die Ursache weiter untersuchen.

> Das Dashboard ist nicht nur zum „Anschauen" da, es ist die Navigationszentrale des gesamten Systems. Jede Zahl ist ein Einstiegspunkt, der Sie vom Makro- zum Mikrobereich Schicht für Schicht zur Ursache eines Problems führt.

---

Nachdem Sie nun einen Überblick über das System und die Dashboards haben, geht es weiter mit den zentralen Geschäftsprozessen – beginnen Sie mit der [Lead-Verwaltung](./guide-leads).

## Verwandte Seiten

- [CRM-Bedienungsanleitung](./index.md)
- [Lead-Verwaltung](./guide-leads)
- [AI Employees](./guide-ai)
