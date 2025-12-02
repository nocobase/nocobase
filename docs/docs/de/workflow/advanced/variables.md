:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Variablen verwenden

## Grundlegende Konzepte

Wie Variablen in einer Programmiersprache sind **Variablen** in einem Workflow ein wichtiges Werkzeug, um Prozesse zu verbinden und zu organisieren.

Wenn ein Workflow ausgelöst wird und jeder Knoten ausgeführt wird, können einige Konfigurationselemente Variablen verwenden. Die Quelle dieser Variablen sind die Daten der vorgelagerten Knoten des aktuellen Knotens. Dazu gehören folgende Kategorien:

-   Trigger-Kontextdaten: Bei Auslösern wie Aktions-Triggern oder Sammlung-Triggern kann ein einzelnes Datenobjekt als Variable von allen Knoten verwendet werden. Die genaue Implementierung variiert je nach Trigger.
-   Daten vorgelagerter Knoten: Wenn der Prozess einen beliebigen Knoten erreicht, sind dies die Ergebnisdaten der zuvor abgeschlossenen Knoten.
-   Lokale Variablen: Befindet sich ein Knoten innerhalb spezieller Verzweigungsstrukturen, kann er spezifische lokale Variablen dieser Verzweigung nutzen. In einer Schleifenstruktur kann beispielsweise das Datenobjekt jeder Iteration verwendet werden.
-   Systemvariablen: Einige integrierte Systemparameter, wie die aktuelle Zeit.

Wir haben die Variablenfunktion bereits mehrfach in [Erste Schritte](../getting-started.md) verwendet. Beispielsweise können wir in einem Rechenknoten Variablen nutzen, um Trigger-Kontextdaten für Berechnungen zu referenzieren:

![Rechenknoten mit Funktionen und Variablen](https://static-docs.nocobase.com/837e4851a4c70a1932542caadef3431b.png)

In einem Aktualisierungsknoten verwenden Sie die Trigger-Kontextdaten als Variable für die Filterbedingung und referenzieren das Ergebnis des Rechenknotens als Variable für den zu aktualisierenden Feldwert:

![Variablen im Datenaktualisierungsknoten](https://static-docs.nocobase.com/2e147c93643e7ebc709b9b7ab4f3af8c.png)

## Datenstruktur

Intern ist eine Variable eine JSON-Struktur. Sie können in der Regel einen bestimmten Teil der Daten über ihren JSON-Pfad verwenden. Da viele Variablen auf der Sammlung-Struktur von NocoBase basieren, werden Verknüpfungsdaten hierarchisch als Objekteigenschaften strukturiert und bilden so eine baumartige Struktur. Beispielsweise können wir den Wert eines bestimmten Feldes aus den Verknüpfungsdaten der abgefragten Daten auswählen. Wenn die Verknüpfungsdaten eine Eins-zu-Viele-Struktur aufweisen, kann die Variable auch ein Array sein.

Bei der Auswahl einer Variable müssen Sie meistens das Attribut des letzten Wertes auswählen, das in der Regel ein einfacher Datentyp wie eine Zahl oder ein String ist. Wenn jedoch in der Variablenhierarchie ein Array vorhanden ist, wird das Attribut der letzten Ebene ebenfalls einem Array zugeordnet. Nur wenn der entsprechende Knoten Arrays unterstützt, können die Array-Daten korrekt verarbeitet werden. Beispielsweise verfügen einige Rechen-Engines in einem Rechenknoten über spezielle Funktionen zur Verarbeitung von Arrays. Ein weiteres Beispiel ist ein Schleifenknoten, bei dem das Schleifenobjekt ebenfalls ein Array sein kann.

Wenn beispielsweise ein Abfrageknoten mehrere Datensätze abfragt, ist das Knotenergebnis ein Array, das mehrere Zeilen homogener Daten enthält:

```json
[
  {
    "id": 1,
    "title": "标题1"
  },
  {
    "id": 2,
    "title": "标题2"
  }
]
```

Wenn Sie es jedoch in nachfolgenden Knoten als Variable verwenden und die ausgewählte Variable die Form `Knotendaten/Abfrageknoten/Titel` hat, erhalten Sie ein Array, das den entsprechenden Feldwerten zugeordnet ist:

```json
["标题1", "标题2"]
```

Handelt es sich um ein mehrdimensionales Array (z. B. ein Viele-zu-Viele-Verknüpfungsfeld), erhalten Sie ein eindimensionales Array, bei dem das entsprechende Feld abgeflacht wurde.

## Systeminterne Variablen

### Systemzeit

Ruft die Systemzeit zum Zeitpunkt der Knotenausführung ab. Die Zeitzone dieser Zeit entspricht der auf dem Server eingestellten Zeitzone.

### Datumsbereichs-Parameter

Können beim Konfigurieren von Filterbedingungen für Datumsfelder in Abfrage-, Aktualisierungs- und Löschknoten verwendet werden. Dies wird nur für "ist gleich"-Vergleiche unterstützt. Sowohl die Start- als auch die Endzeit des Datumsbereichs basieren auf der auf dem Server eingestellten Zeitzone.

![Datumsbereichs-Parameter](https://static-docs.nocobase.com/20240817175354.png)