:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Bedingung

## Einführung

Ähnlich der `if`-Anweisung in Programmiersprachen bestimmt der Knoten die weitere Richtung des Workflows, basierend auf dem Ergebnis einer konfigurierten Bedingung.

## Knoten erstellen

Der Bedingungs-Knoten bietet zwei Modi: „Fortfahren, wenn wahr“ und „Verzweigen bei wahr/falsch“. Sie müssen einen dieser Modi beim Erstellen des Knotens auswählen. Danach kann der Modus in der Knotenkonfiguration nicht mehr geändert werden.

![Condition_Mode_Selection](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)

Im Modus „Fortfahren, wenn wahr“ gilt: Wenn das Ergebnis der Bedingung „wahr“ ist, wird der Workflow die nachfolgenden Knoten weiter ausführen. Andernfalls wird der Workflow beendet und mit dem Status „Fehlgeschlagen“ vorzeitig abgebrochen.

!["Continue if true" mode](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Dieser Modus eignet sich für Szenarien, in denen der Workflow nicht fortgesetzt werden soll, wenn die Bedingung nicht erfüllt ist. Stellen Sie sich zum Beispiel einen Formular-Senden-Button für eine Bestellung vor, der an ein „Vor-Aktion-Ereignis“ gebunden ist. Wenn der Lagerbestand des Produkts in der Bestellung nicht ausreicht, soll die Bestellerstellung nicht fortgesetzt, sondern mit einem Fehler abgebrochen werden.

Im Modus „Verzweigen bei wahr/falsch“ erzeugt der Bedingungs-Knoten zwei nachfolgende Workflow-Zweige. Diese entsprechen den Ergebnissen „wahr“ und „falsch“ der Bedingung. Jeder Zweig kann mit eigenen nachfolgenden Knoten konfiguriert werden. Nachdem einer der Zweige seine Ausführung abgeschlossen hat, führt er automatisch wieder in den übergeordneten Zweig des Bedingungs-Knotens zurück, um die Ausführung der folgenden Knoten fortzusetzen.

!["Branch on true/false" mode](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Dieser Modus eignet sich für Szenarien, in denen unterschiedliche Aktionen ausgeführt werden müssen, je nachdem, ob die Bedingung erfüllt ist oder nicht. Zum Beispiel, um zu prüfen, ob ein Datensatz existiert: Wenn er nicht existiert, wird er erstellt; wenn er existiert, wird er aktualisiert.

## Knotenkonfiguration

### Berechnungs-Engine

Aktuell werden drei Engines unterstützt:

- **Basis**: Erzielt ein logisches Ergebnis durch einfache binäre Berechnungen und „UND“-/„ODER“-Gruppierungen.
- **Math.js**: Berechnet Ausdrücke, die von der [Math.js](https://mathjs.org/)-Engine unterstützt werden, um ein logisches Ergebnis zu erhalten.
- **Formula.js**: Berechnet Ausdrücke, die von der [Formula.js](https://formulajs.info/)-Engine unterstützt werden, um ein logisches Ergebnis zu erhalten.

In allen drei Berechnungstypen können Variablen aus dem Workflow-Kontext als Parameter verwendet werden.