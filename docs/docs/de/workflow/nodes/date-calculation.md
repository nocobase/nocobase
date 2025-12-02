---
pkg: '@nocobase/plugin-workflow-date-calculation'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Datumsberechnung

## Einführung

Der Datumsberechnungs-Knoten stellt neun Berechnungsfunktionen bereit, darunter das Hinzufügen oder Subtrahieren von Zeiträumen, die formatierte Ausgabe von Datums-Strings und die Umrechnung von Zeiteinheiten. Jede Funktion besitzt spezifische Eingabe- und Ausgabewerttypen und kann zudem Ergebnisse anderer Knoten als Parameter empfangen. Mithilfe einer Berechnungs-Pipeline werden die Ergebnisse der konfigurierten Funktionen miteinander verkettet, um letztendlich eine gewünschte Ausgabe zu erhalten.

## Knoten erstellen

Im Konfigurationsbereich des Workflows klicken Sie auf das Plus-Symbol („+“) im Ablauf, um einen „Datumsberechnungs“-Knoten hinzuzufügen:

![Datumsberechnungs-Knoten_Knoten erstellen](https://static-docs.nocobase.com/[图片].png)

## Knotenkonfiguration

![Datumsberechnungs-Knoten_Knotenkonfiguration](https://static-docs.nocobase.com/20240817184423.png)

### Eingabewert

Als Eingabewert können Sie entweder eine Variable oder eine Datumskonstante wählen. Eine Variable kann die Daten sein, die diesen Workflow ausgelöst haben, oder das Ergebnis eines vorherigen Knotens in diesem Workflow. Für eine Konstante können Sie jedes beliebige Datum auswählen.

### Eingabewerttyp

Dies bezieht sich auf den Typ des Eingabewerts. Es gibt zwei mögliche Werte:

*   Datumstyp: Der Eingabewert kann letztendlich in einen Datums- und Uhrzeit-Typ umgewandelt werden, zum Beispiel ein numerischer Zeitstempel oder ein String, der eine Zeitangabe darstellt.
*   Zahlentyp: Da der Typ des Eingabewerts die Auswahl der nachfolgenden Zeitberechnungsschritte beeinflusst, ist es wichtig, den korrekten Eingabewerttyp zu wählen.

### Berechnungsschritte

Jeder Berechnungsschritt besteht aus einer Berechnungsfunktion und deren Parameterkonfiguration. Das Design ist pipeline-basiert: Das Ergebnis der vorherigen Funktion dient als Eingabewert für die nächste Funktion und wird in die weitere Berechnung einbezogen. Auf diese Weise können Sie eine Reihe von Zeitberechnungen und -umwandlungen durchführen.

Nach jedem Berechnungsschritt ist der Ausgabetyp ebenfalls festgelegt und beeinflusst die Funktionen, die für den nächsten Berechnungsschritt zur Verfügung stehen. Die Berechnung kann nur fortgesetzt werden, wenn die Typen übereinstimmen. Andernfalls wird das Ergebnis eines Schritts als endgültige Ausgabe des Knotens verwendet.

## Berechnungsfunktionen

### Zeitraum hinzufügen

-   Akzeptiert Eingabewerttyp: Datum
-   Parameter
    -   Die hinzuzufügende Menge, die eine Zahl oder eine integrierte Variable des Knotens sein kann.
    -   Zeiteinheit.
-   Ausgabewerttyp: Datum
-   Beispiel: Wenn der Eingabewert `2024-7-15 00:00:00` ist, die Menge `1` und die Einheit „Tag“, dann ist das Berechnungsergebnis `2024-7-16 00:00:00`.

### Zeitraum subtrahieren

-   Akzeptiert Eingabewerttyp: Datum
-   Parameter
    -   Die zu subtrahierende Menge, die eine Zahl oder eine integrierte Variable des Knotens sein kann.
    -   Zeiteinheit.
-   Ausgabewerttyp: Datum
-   Beispiel: Wenn der Eingabewert `2024-7-15 00:00:00` ist, die Menge `1` und die Einheit „Tag“, dann ist das Berechnungsergebnis `2024-7-14 00:00:00`.

### Differenz zu einer anderen Zeit berechnen

-   Akzeptiert Eingabewerttyp: Datum
-   Parameter
    -   Das Datum, mit dem die Differenz berechnet werden soll. Hier können Sie eine Datumskonstante oder eine Variable aus dem Workflow-Kontext wählen.
    -   Zeiteinheit.
    -   Ob der absolute Wert verwendet werden soll.
    -   Rundungsoperation: Sie können zwischen „Dezimalstellen beibehalten“, „Runden“, „Aufrunden“ und „Abrunden“ wählen.
-   Ausgabewerttyp: Zahl
-   Beispiel: Wenn der Eingabewert `2024-7-15 00:00:00` ist, das Vergleichsobjekt `2024-7-16 06:00:00`, die Einheit „Tag“, kein absoluter Wert genommen und Dezimalstellen beibehalten werden, dann ist das Berechnungsergebnis `-1.25`.

:::info{title=Tipp}
Wenn der absolute Wert und die Rundung gleichzeitig konfiguriert werden, wird zuerst der absolute Wert ermittelt und dann gerundet.
:::

### Wert einer Zeit in einer bestimmten Einheit abrufen

-   Akzeptiert Eingabewerttyp: Datum
-   Parameter
    -   Zeiteinheit.
-   Ausgabewerttyp: Zahl
-   Beispiel: Wenn der Eingabewert `2024-7-15 00:00:00` und die Einheit „Tag“ ist, dann ist das Berechnungsergebnis `15`.

### Datum auf den Beginn einer bestimmten Einheit setzen

-   Akzeptiert Eingabewerttyp: Datum
-   Parameter
    -   Zeiteinheit.
-   Ausgabewerttyp: Datum
-   Beispiel: Wenn der Eingabewert `2024-7-15 14:26:30` und die Einheit „Tag“ ist, dann ist das Berechnungsergebnis `2024-7-15 00:00:00`.

### Datum auf das Ende einer bestimmten Einheit setzen

-   Akzeptiert Eingabewerttyp: Datum
-   Parameter
    -   Zeiteinheit.
-   Ausgabewerttyp: Datum
-   Beispiel: Wenn der Eingabewert `2024-7-15 14:26:30` und die Einheit „Tag“ ist, dann ist das Berechnungsergebnis `2024-7-15 23:59:59`.

### Schaltjahr prüfen

-   Akzeptiert Eingabewerttyp: Datum
-   Parameter
    -   Keine Parameter
-   Ausgabewerttyp: Boolesch
-   Beispiel: Wenn der Eingabewert `2024-7-15 14:26:30` ist, dann ist das Berechnungsergebnis `true`.

### Als String formatieren

-   Akzeptiert Eingabewerttyp: Datum
-   Parameter
    -   Format, siehe [Day.js: Format](https://day.js.org/docs/en/display/format)
-   Ausgabewerttyp: String
-   Beispiel: Wenn der Eingabewert `2024-7-15 14:26:30` und das Format `the time is YYYY/MM/DD HH:mm:ss` ist, dann ist das Berechnungsergebnis `the time is 2024/07/15 14:26:30`.

### Einheit umrechnen

-   Akzeptiert Eingabewerttyp: Zahl
-   Parameter
    -   Zeiteinheit vor der Umrechnung.
    -   Zeiteinheit nach der Umrechnung.
    -   Rundungsoperation: Sie können zwischen „Dezimalstellen beibehalten“, „Runden“, „Aufrunden“ und „Abrunden“ wählen.
-   Ausgabewerttyp: Zahl
-   Beispiel: Wenn der Eingabewert `2` ist, die Einheit vor der Umrechnung „Woche“, die Einheit nach der Umrechnung „Tag“ und keine Dezimalstellen beibehalten werden, dann ist das Berechnungsergebnis `14`.

## Beispiel

![Datumsberechnungs-Knoten_Beispiel](https://static-docs.nocobase.com/20240817184137.png)

Angenommen, es gibt eine Werbeaktion und Sie möchten beim Erstellen jedes Produkts ein Enddatum für diese Aktion im Produktfeld hinzufügen. Dieses Enddatum soll um 23:59:59 Uhr am letzten Tag der Woche nach der Produkterstellung liegen. Dazu können Sie zwei Zeitfunktionen erstellen und diese in einer Pipeline ausführen lassen:

-   Die Zeit für die nächste Woche berechnen
-   Das Ergebnis auf 23:59:59 Uhr am letzten Tag dieser Woche zurücksetzen

Auf diese Weise erhalten Sie den gewünschten Zeitwert und können ihn an den nächsten Knoten weitergeben, zum Beispiel an einen Sammlung-Modifikationsknoten, um das Enddatum der Werbeaktion zur Sammlung hinzuzufügen.