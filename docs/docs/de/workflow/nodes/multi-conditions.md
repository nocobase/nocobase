:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Mehrfachbedingungen <Badge>v2.0.0+</Badge>

## Einführung

Ähnlich wie `switch / case`- oder `if / else if`-Anweisungen in Programmiersprachen. Das System prüft die konfigurierten Bedingungen nacheinander. Sobald eine Bedingung erfüllt ist, wird der entsprechende Workflow-Zweig ausgeführt und die Prüfung weiterer Bedingungen übersprungen. Wenn keine der Bedingungen erfüllt ist, wird der „Sonst“-Zweig ausgeführt.

## Knoten erstellen

Klicken Sie in der Workflow-Konfiguration auf das Plus-Symbol („+“) im Workflow, um einen „Mehrfachbedingungen“-Knoten hinzuzufügen:

![Mehrfachbedingungen-Knoten erstellen](https://static-docs.nocobase.com/20251123222134.png)

## Zweigverwaltung

### Standardzweige

Nach der Erstellung enthält der Knoten standardmäßig zwei Zweige:

1.  **Bedingungszweig**: Hier konfigurieren Sie die spezifischen Prüfbedingungen.
2.  **Sonst-Zweig**: Dieser Zweig wird ausgeführt, wenn keine der Bedingungszweige erfüllt ist. Hierfür ist keine Bedingungseinstellung erforderlich.

Klicken Sie unterhalb des Knotens auf die Schaltfläche „Zweig hinzufügen“, um weitere Bedingungszweige hinzuzufügen.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Zweig hinzufügen

Nach dem Klicken auf „Zweig hinzufügen“ wird der neue Zweig vor dem „Sonst“-Zweig eingefügt.

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Zweig löschen

Wenn mehrere Bedingungszweige vorhanden sind, können Sie einen Zweig löschen, indem Sie auf das Mülleimer-Symbol rechts neben dem Zweig klicken. Ist nur noch ein Bedingungszweig vorhanden, kann dieser nicht gelöscht werden.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Hinweis}
Das Löschen eines Zweiges entfernt auch alle darin enthaltenen Knoten. Gehen Sie daher bitte mit Vorsicht vor.

Der „Sonst“-Zweig ist ein integrierter Zweig und kann nicht gelöscht werden.
:::

## Knotenkonfiguration

### Bedingungskonfiguration

Klicken Sie auf den Bedingungsnamen oben im Zweig, um die spezifischen Bedingungsdetails zu bearbeiten:

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Bedingungsbezeichnung

Sie können benutzerdefinierte Bezeichnungen verwenden. Nach dem Ausfüllen wird diese als Bedingungsname im Workflow-Diagramm angezeigt. Wenn keine Bezeichnung konfiguriert (oder leer gelassen) wird, werden die Bedingungen standardmäßig der Reihe nach als „Bedingung 1“, „Bedingung 2“ usw. angezeigt.

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Berechnungs-Engine

Derzeit werden drei Engines unterstützt:

-   **Basis**: Ermittelt Ergebnisse durch einfache logische Vergleiche (z. B. gleich, enthält) und „UND“-/„ODER“-Kombinationen.
-   **Math.js**: Unterstützt die Berechnung von Ausdrücken mit der [Math.js](https://mathjs.org/)-Syntax.
-   **Formula.js**: Unterstützt die Berechnung von Ausdrücken mit der [Formula.js](https://formulajs.info/)-Syntax (ähnlich wie Excel-Formeln).

Alle drei Modi unterstützen die Verwendung von Workflow-Kontextvariablen als Parameter.

### Wenn keine der Bedingungen erfüllt ist

Im Knotenkonfigurationsbereich können Sie festlegen, welche Aktion ausgeführt werden soll, wenn keine der Bedingungen erfüllt ist:

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

*   **Workflow mit Fehler beenden (Standard)**: Markiert den Workflow-Status als fehlgeschlagen und beendet den Prozess.
*   **Nachfolgende Knoten weiter ausführen**: Nach Abschluss der Ausführung des aktuellen Knotens werden die nachfolgenden Knoten im Workflow weiter ausgeführt.

:::info{title=Hinweis}
Unabhängig von der gewählten Verarbeitungsart wird der Workflow, wenn keine der Bedingungen erfüllt ist, immer zuerst den „Sonst“-Zweig betreten und die darin enthaltenen Knoten ausführen.
:::

## Ausführungsverlauf

Im Ausführungsverlauf des Workflows kennzeichnet der Mehrfachbedingungen-Knoten das Ergebnis jeder Bedingungsprüfung durch verschiedene Farben:

-   **Grün**: Bedingung erfüllt; dieser Zweig wurde betreten und ausgeführt.
-   **Rot**: Bedingung nicht erfüllt (oder Berechnungsfehler); dieser Zweig wurde übersprungen.
-   **Blau**: Prüfung nicht ausgeführt (übersprungen, da eine vorherige Bedingung bereits erfüllt war).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Wenn ein Konfigurationsfehler zu einer Ausnahme bei der Bedingungsberechnung führt, wird dies nicht nur rot angezeigt, sondern beim Bewegen der Maus über den Bedingungsnamen werden auch spezifische Fehlerinformationen angezeigt:

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

Tritt bei der Bedingungsberechnung eine Ausnahme auf, wird der Mehrfachbedingungen-Knoten mit dem Status „Fehler“ beendet und führt keine weiteren nachfolgenden Knoten aus.