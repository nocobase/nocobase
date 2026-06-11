---
pkg: '@nocobase/plugin-workflow-transaction'
title: "Workflow-Knoten - Datenbanktransaktion"
description: "Datenbanktransaktions-Knoten: Führt Datenoperationen derselben Datenquelle in einer Transaktion aus, schreibt bei Erfolg fest und rollt bei Fehlern zurück."
keywords: "Workflow,Datenbanktransaktion,Transaction,Rollback,Commit,Datenoperation,NocoBase"
---

# Datenbanktransaktion

## Einführung

Der Datenbanktransaktions-Knoten führt eine Gruppe von Datenbankoperationen in derselben Transaktion aus. Er eignet sich für Szenarien, in denen mehrere Verarbeitungsschritte entweder vollständig erfolgreich sein oder vollständig zurückgerollt werden müssen, zum Beispiel beim Erstellen einer Bestellung, Reduzieren des Lagerbestands, Schreiben von Detaildaten und Aktualisieren eines Status.

Der Transaktionsknoten unterstützt derzeit nur Datenbank-Datenquellen. Datenoperationen derselben Datenquelle innerhalb des Knotens werden automatisch in diese Transaktion aufgenommen; andere Datenquellen verwenden diese Transaktion nicht.

## Knoten erstellen

Klicken Sie in der Workflow-Konfigurationsoberfläche im Ablauf auf die Plus-Schaltfläche („+“), um einen Knoten „Datenbanktransaktion“ hinzuzufügen.

![20260610205146](https://static-docs.nocobase.com/20260610205146.png)

Nach dem Erstellen werden zwei Zweige generiert:

- **Ausführen**: Der Hauptzweig, der innerhalb der Transaktion ausgeführt wird. Wenn alle Knoten in diesem Zweig erfolgreich sind, wird die Transaktion automatisch festgeschrieben. Wenn ein Knoten fehlschlägt oder einen Fehler auslöst, wird die Transaktion automatisch zurückgerollt.
- **Nach Rollback**: Der Zweig, der nach dem Rollback ausgeführt wird. Dieser Zweig läuft außerhalb der Transaktion und kann zum Protokollieren, Senden von Benachrichtigungen oder Ausführen von Kompensationslogik verwendet werden.

![20260610205303](https://static-docs.nocobase.com/20260610205303.png)

## Knotenkonfiguration

![20260610205505](https://static-docs.nocobase.com/20260610205505.png)

### Datenquelle

Wählen Sie die Datenbank-Datenquelle aus, die von dieser Transaktion kontrolliert wird. Nur Datenoperationsknoten derselben Datenquelle werden automatisch in die Transaktion aufgenommen.

### Isolationsstufe

Legen Sie die Isolationsstufe der Transaktion fest. Der Standardwert ist `READ UNCOMMITTED`. Wenn Ihre Geschäftslogik strengere Datenkonsistenz erfordert, wählen Sie entsprechend den Fähigkeiten der Datenbank und den Anforderungen an Parallelität eine andere Isolationsstufe.

### Workflow nach Rollback fortsetzen

Wenn diese Option aktiviert ist, wird der Workflow nach Abschluss des Zweigs `Nach Rollback` mit den Knoten nach dem Transaktionsknoten fortgesetzt.

Wenn diese Option deaktiviert ist, endet der Workflow nach Abschluss des Zweigs `Nach Rollback` am Transaktionsknoten, und nachfolgende Knoten werden nicht ausgeführt.

## Verwendung

### Einschränkungen

Der Zweig `Ausführen` unterstützt keine asynchronen Knoten, die den Workflow anhalten, zum Beispiel manuelle Bearbeitung oder Verzögerung. Die Transaktion muss während der aktuellen Ausführung festgeschrieben oder zurückgerollt werden. Wenn der Zweig `Ausführen` in einen Wartezustand wechselt, rollt das System die Transaktion zurück und markiert den Workflow als fehlgeschlagen.

Der Zweig `Nach Rollback` wird außerhalb der Transaktion ausgeführt und unterliegt daher nicht dieser Einschränkung. Sie können in diesem Zweig bei Bedarf asynchrone Knoten verwenden, zum Beispiel zum Senden von Anfragen, Warten auf manuelle Bestätigung oder verzögerten Verarbeiten.

:::warning Hinweis
Transaktionen belegen Datenbankverbindungen, bis sie festgeschrieben oder zurückgerollt werden. Vermeiden Sie lang laufende Operationen im Zweig `Ausführen` und behalten Sie dort nur notwendige Lese-, Schreib- und Prüfoperationen.
:::

### Verschachtelte Transaktionen

Transaktionsknoten können verschachtelt werden. Beachten Sie dabei den Datenquellenbereich:

- Wenn innere und äußere Transaktion dieselbe Datenquelle verwenden, wird die innere Transaktion im Bereich der äußeren Transaktion erstellt und entsprechend den Fähigkeiten der Datenbank und von Sequelize verarbeitet.
- Wenn die innere Transaktion eine andere Datenquelle verwendet, wird die äußere Transaktion nicht wiederverwendet. Stattdessen wird für diese Datenquelle eine unabhängige Transaktion erstellt.
- Wenn der Workflow durch ein synchrones Sammlungsereignis ausgelöst wird, kann der Trigger selbst bereits eine Top-Level-Transaktion für dieselbe Datenquelle bereitstellen. Der Transaktionsknoten verwendet bevorzugt die äußere Transaktion derselben Datenquelle und verwendet keine Transaktionen anderer Datenquellen.

Verschachtelte Transaktionen erhöhen den Aufwand für Verständnis und Fehlersuche. Verwenden Sie sie normalerweise nur, wenn Sie wirklich eine lokale Rollback-Grenze benötigen. Andernfalls sollten Sie den vollständigen Datenverarbeitungsablauf mit einem einzigen Transaktionsknoten umschließen.

### Häufiges Szenario

Ein typischer Ablauf sieht wie folgt aus:

1. Im Zweig `Ausführen` werden relevante Daten abgefragt oder erstellt.
2. Im Zweig `Ausführen` werden weiterhin Lagerbestand, Status, Detaildaten und andere Daten derselben Datenquelle aktualisiert.
3. Wenn alle Schritte erfolgreich sind, wird die Transaktion automatisch festgeschrieben.
4. Wenn ein Knoten fehlschlägt oder einen Fehler auslöst, wird die Transaktion automatisch zurückgerollt und der Workflow wechselt in den Zweig `Nach Rollback`.
5. Im Zweig `Nach Rollback` werden Fehlergründe protokolliert, Benachrichtigungen gesendet oder Kompensationslogik ausgeführt.

Wenn der Workflow nach dem Rollback fortgesetzt werden soll, aktivieren Sie „Workflow nach Rollback fortsetzen“.
