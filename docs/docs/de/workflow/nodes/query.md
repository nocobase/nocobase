:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Daten abfragen

Dient dazu, Daten aus einer Sammlung abzufragen und abzurufen, die bestimmte Bedingungen erfüllen.

Sie können konfigurieren, ob eine einzelne Datenzeile oder mehrere Datenzeilen abgefragt werden sollen. Das Abfrageergebnis kann als Variable in nachfolgenden Knoten verwendet werden. Wenn Sie mehrere Datenzeilen abfragen, ist das Ergebnis ein Array. Ist das Abfrageergebnis leer, können Sie wählen, ob die Ausführung der nachfolgenden Knoten fortgesetzt werden soll.

## Knoten erstellen

In der Workflow-Konfigurationsoberfläche klicken Sie im Workflow auf die Plus-Schaltfläche („+“), um einen „Daten abfragen“-Knoten hinzuzufügen:

![Daten abfragen Knoten hinzufügen](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)

## Knotenkonfiguration

![Knotenkonfiguration für Datenabfrage](https://static-docs.nocobase.com/20240520131324.png)

### Sammlung

Wählen Sie die Sammlung aus, aus der Daten abgefragt werden sollen.

### Ergebnistyp

Der Ergebnistyp ist in „Einzelne Datenzeile“ und „Mehrere Datenzeilen“ unterteilt:

-   Einzelne Datenzeile: Das Ergebnis ist ein Objekt, das nur die erste übereinstimmende Datenzeile enthält, oder `null`.
-   Mehrere Datenzeilen: Das Ergebnis ist ein Array, das alle übereinstimmenden Datenzeilen enthält. Wenn keine Datenzeilen übereinstimmen, ist es ein leeres Array. Sie können diese einzeln mit einem Schleifen-Knoten verarbeiten.

### Filterbedingungen

Ähnlich wie bei den Filterbedingungen einer regulären Sammlungsabfrage können Sie die Kontextvariablen des Workflows verwenden.

### Sortierung

Beim Abfragen einer oder mehrerer Datenzeilen können Sie die gewünschten Ergebnisse durch Sortierregeln steuern. Um beispielsweise die neueste Datenzeile abzufragen, können Sie nach dem Feld „Erstellungszeit“ in absteigender Reihenfolge sortieren.

### Paginierung

Wenn das Ergebnisset sehr groß sein könnte, können Sie die Paginierung verwenden, um die Anzahl der Abfrageergebnisse zu steuern. Um beispielsweise die neuesten 10 Datenzeilen abzufragen, können Sie nach dem Feld „Erstellungszeit“ in absteigender Reihenfolge sortieren und dann die Paginierung auf 1 Seite mit 10 Datenzeilen einstellen.

### Umgang mit leeren Ergebnissen

Im Modus „Einzelne Datenzeile“ ist das Abfrageergebnis `null`, wenn keine Daten den Bedingungen entsprechen. Im Modus „Mehrere Datenzeilen“ ist es ein leeres Array (`[]`). Sie können bei Bedarf die Option „Workflow beenden, wenn Abfrageergebnis leer ist“ aktivieren. Ist diese Option aktiviert und das Abfrageergebnis leer, werden nachfolgende Knoten nicht ausgeführt und der Workflow wird vorzeitig mit dem Status „Fehlgeschlagen“ beendet.