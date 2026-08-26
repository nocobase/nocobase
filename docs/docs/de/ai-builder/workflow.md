---
title: "Workflow-Verwaltung"
description: "Der Workflow-Verwaltungs-Skill dient dem Erstellen, Bearbeiten, Aktivieren und Diagnostizieren von NocoBase-Workflows."
keywords: "KI-Builder,Workflow,Trigger,Knoten,Genehmigung,Automatisierung"
---

# Workflow-Verwaltung

:::tip Voraussetzung

Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie NocoBase CLI gemäß dem [Schnellstart KI-Builder](./index.md) installiert und initialisiert haben.

:::

## Einführung

Der Workflow-Verwaltungs-Skill dient dem Erstellen, Bearbeiten, Aktivieren und Diagnostizieren von NocoBase-Workflows – von der Auswahl des Triggers über den Aufbau der Knotenkette bis zur Fehleranalyse der Ausführungsergebnisse, deckt er den gesamten Lebenszyklus der Workflow-Nutzung ab.


## Funktionsumfang

Möglich:

- Workflows erstellen: Trigger-Typ auswählen und Verarbeitungsknoten Schritt für Schritt hinzufügen
- Workflows bearbeiten: Trigger-Konfiguration ändern, Knoten hinzufügen/entfernen/bearbeiten, verschieben und kopieren
- Versionsverwaltung: Bereits ausgeführte Versionen erzeugen automatisch eine neue Revision, ohne den Verlauf zu beeinträchtigen
- Aktivieren und manuelles Ausführen von Workflows
- Diagnose fehlgeschlagener Ausführungen: Lokalisierung des fehlerhaften Knotens und der Fehlermeldung

Nicht möglich:

- Kein Entwurf von Datenmodellen (verwenden Sie den [Datenmodellierungs-Skill](./data-modeling))
- Keine Installation von MCP und keine Behandlung von Umgebungsproblemen (verwenden Sie den [Umgebungsverwaltungs-Skill](./env-bootstrap))
- Kein Löschen ganzer Workflows (eine Hochrisikooperation, die separat bestätigt werden muss)
- Keine Erfindung von Knoten- oder Trigger-Typen aus dem Nichts

## Beispiel-Prompts

### Szenario A: Neuen Workflow erstellen

```
Bitte orchestriere einen Workflow, der nach der Erstellung einer Bestellung automatisch den Lagerbestand der Produkte reduziert.
```

Der Skill bestätigt zunächst den Trigger-Typ und das Knotenketten-Design und führt nach Bestätigung die Erstellung schrittweise durch.

![20260419234303](https://static-docs.nocobase.com/20260419234303.png)

### Szenario B: Bestehenden Workflow bearbeiten

```
Füge im Workflow zur Bestellerstellung einen Benachrichtigungsknoten hinzu, der bei unzureichendem Lagerbestand eine interne Nachricht an den Administrator sendet.
```

Wenn die aktuelle Version bereits ausgeführt wurde, wird zunächst eine neue Revision angelegt und anschließend bearbeitet, ohne den Ausführungsverlauf zu beeinträchtigen.

![20260419234419](https://static-docs.nocobase.com/20260419234419.png)

### Szenario C: Ausführungsfehler diagnostizieren

```
Der Workflow zur Lagerbestandsreduzierung nach Bestellerstellung ist bei der letzten Ausführung fehlgeschlagen. Bitte sieh nach, woran es liegt.
```

Die letzte fehlgeschlagene Ausführung wird gefunden, der fehlerhafte Knoten und die Fehlermeldung werden lokalisiert und Korrekturvorschläge werden gegeben.

![20260419234532](https://static-docs.nocobase.com/20260419234532.png)

### Szenario D: Workflow-Logik analysieren oder zusammenfassen

```
Bitte analysiere die Verarbeitungslogik des Workflows „Lagerbestandsreduzierung nach Bestellerstellung".
```

Ausgabe:

```markdown
# Workflow-Analyse: Lagerbestandsreduzierung nach Bestellerstellung

## Workflow-Überblick
**Workflow-Name:** Lagerbestandsreduzierung nach Bestellerstellung

### Trigger
- **Typ:** Post-Action-Ereignis (Action)
- **Auslösebedingung:** Wird ausgelöst, wenn die Collection `orders` (Bestellungen) die Aktion „Erstellen" ausführt (globaler Trigger).
- **Verknüpfte Daten:** Beim Auslösen werden die zugehörigen Daten `details` (Bestelldetails) übergeben.
- **Ausführungsmodus:** Asynchron

---

### Knoten-Ausführungskette

**[Trigger] Bestellung erstellt**
        │
        ▼
**[1] Bestelldetails durchlaufen (Loop)**
    * **Ziel:** `{{$context.data.details}}`
    * *Aktion: Für jede Detailposition werden folgende Schritte ausgeführt:*
        │
        ▼
    **branchIndex=0 (Schleifenkörper)**
        │
        ▼
    **[2] Lagerbestand abfragen (Query)**
    * **Collection:** `products`
    * **Filterbedingung:** `id = {{$scopes.5u6lsjzf8vh.item.productId}}`
        │
        ▼
    **[3] Lagerbestand prüfen (Condition)**
    * **Engine:** `formula.js`
    * **Ausdruck:** `{{$jobsMapByNodeKey.n6rf8lf2lum.inventory}} < {{$scopes.5u6lsjzf8vh.item.quantity}}`
        │
        ├── **YES (branchIndex=1, Lagerbestand unzureichend, Bedingung TRUE):**
        │   ▼
        │   **[4] Super-Administrator benachrichtigen (Notification)**
        │   *Sendet eine Benachrichtigung an Benutzer der Rolle root mit folgenden Inhalten:*
        │   *Produktname, Produkt-ID, aktueller Lagerbestand, in der Bestellung benötigte Menge.*
        │
        └── **NO (branchIndex=0, Lagerbestand ausreichend, leerer Zweig)**
        │
        ▼
    **[5] Lagerbestand reduzieren (SQL)**
    * **SQL-Anweisung:** `UPDATE products SET inventory = inventory - :quantity`

---

### Erläuterung der Kernlogik

| Phase | Erläuterung |
| :--- | :--- |
| **Trigger** | Beim Erstellen der Bestellung übergibt das System die vollständige Liste der Bestelldetails an den Workflow. |
| **Schleife** | Verarbeitet jede Detailzeile einzeln; jede Zeile entspricht einem Produkt mit Bestellmenge. |
| **Abfrage** | Ermittelt den aktuellen Lagerbestand des Produkts über die `productId`. |
| **Prüfung** | Beurteilt, ob `inventory < quantity` zutrifft (also ob der Lagerbestand unzureichend ist). |
| **Benachrichtigung** | Bei unzureichendem Lagerbestand wird eine interne Nachricht an Benutzer mit der Rolle `root` gesendet. |
| **Reduzierung** | Aktualisiert den Lagerbestand direkt per SQL. Da die Zweige zusammengeführt werden, wird die Reduzierung unabhängig vom Lagerbestand ausgeführt. |

---

### ⚠️ Mögliches Designproblem

Die `downstreamId` des Bedingungsknotens verweist auf den Knoten „Lagerbestand reduzieren". Das bedeutet: Egal welcher Zweig ausgeführt wird (Lagerbestand ausreichend oder nicht), am Ende wird die Reduzierung immer durchgeführt. Das tatsächliche Verhalten ist:

- **Lagerbestand ausreichend** $\rightarrow$ Direkte Lagerbestandsreduzierung (Standardablauf). ✓
- **Lagerbestand unzureichend** $\rightarrow$ Erst wird der Administrator benachrichtigt, **anschließend wird trotzdem reduziert** (kann dazu führen, dass der Lagerbestand negativ wird).

**Analyse:** Dieses Design entspricht dem Muster „Überverkauf zulassen und vorwarnen", könnte aber auch ein Logikfehler sein (eigentlich sollte bei unzureichendem Bestand nicht reduziert werden). Die Designabsicht muss mit dem Fachbereich geklärt werden.

---

### Aktueller Status

- **Aktivierungsstatus:** `false` (deaktiviert)
- **Ausführungsdatensätze:** 1 Mal ausgeführt.
- **Versionskontrolle:** Die aktuelle Version ist eingefroren. Für Änderungen muss zuerst eine neue Version erstellt werden.
```

## Häufige Fragen

**Warum wird ein neu erstellter Workflow nicht ausgelöst?**

Neu erstellte Workflows sind standardmäßig deaktiviert (`enabled: false`). Bestätigen Sie zunächst die korrekte Trigger-Konfiguration und aktivieren Sie ihn anschließend manuell.

**Werden bestehende Ausführungsdatensätze beim Bearbeiten eines Workflows beeinflusst?**

Nein. Wenn die aktuelle Version bereits Ausführungsdatensätze hat, erstellt der Skill automatisch eine neue Revision; die Ausführungsdatensätze bleiben an die alte Version gebunden und werden nicht beeinflusst.

## Verwandte Links

- [Übersicht KI-Builder](./index.md) – Überblick über alle KI-Builder-Skills und deren Installation
- [Datenmodellierung](./data-modeling) – Datentabellen mit der KI erstellen und verwalten
- [Umgebungsverwaltung](./env-bootstrap) – Umgebungsprüfung, Installation, Bereitstellung und Fehlerdiagnose
