---
pkg: '@nocobase/plugin-workflow-json-variable-mapping'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# JSON Variablen-Mapping

> v1.6.0

## Einführung

Dient dazu, komplexe JSON-Strukturen aus den Ergebnissen vorgelagerter Knoten in Variablen zu überführen, die von nachfolgenden Knoten verwendet werden können. Beispielsweise können Sie nach dem Mapping die Eigenschaftswerte von Ergebnissen aus SQL-Operationen und HTTP-Anfrage-Knoten in späteren Knoten nutzen.

:::info{title=Tipp}
Im Gegensatz zum JSON-Berechnungsknoten unterstützt der JSON-Variablen-Mapping-Knoten keine benutzerdefinierten Ausdrücke und basiert nicht auf einer Drittanbieter-Engine. Er dient ausschließlich dazu, Eigenschaftswerte innerhalb einer JSON-Struktur zuzuordnen, ist aber einfacher zu bedienen.
:::

## Knoten erstellen

Klicken Sie in der Workflow-Konfigurationsoberfläche auf das Pluszeichen („+“) im Workflow, um einen „JSON Variablen-Mapping“-Knoten hinzuzufügen:

![Knoten erstellen](https://static-docs.nocobase.com/20250113173635.png)

## Knotenkonfiguration

### Datenquelle

Die Datenquelle kann das Ergebnis eines vorgelagerten Knotens oder ein Datenobjekt im Prozesskontext sein. Typischerweise handelt es sich um ein unstrukturiertes Datenobjekt, wie zum Beispiel das Ergebnis eines SQL-Knotens oder eines HTTP-Anfrage-Knotens.

![Datenquelle](https://static-docs.nocobase.com/20250113173720.png)

### Beispiel-Daten eingeben

Fügen Sie Beispiel-Daten ein und klicken Sie auf die Schaltfläche „Parsen“, um automatisch eine Liste von Variablen zu generieren:

![Beispiel-Daten eingeben](https://static-docs.nocobase.com/20250113182327.png)

Falls die automatisch generierte Liste Variablen enthält, die Sie nicht benötigen, können Sie diese durch Klicken auf die Schaltfläche „Löschen“ entfernen.

:::info{title=Tipp}
Die Beispiel-Daten stellen nicht das endgültige Ausführungsergebnis dar; sie dienen lediglich dazu, die Generierung der Variablenliste zu unterstützen.
:::

### Pfad enthält Array-Index

Wenn diese Option nicht aktiviert ist, werden die Array-Inhalte gemäß der standardmäßigen Variablenbehandlung von NocoBase-Workflows gemappt. Geben Sie beispielsweise das folgende Beispiel ein:

```json
{
  "a": 1,
  "b": [
    {
      "c": 2
    },
    {
      "c": 3
    }
  ]
}
```

In den generierten Variablen repräsentiert `b.c` das Array `[2, 3]`.

Wenn diese Option aktiviert ist, enthält der Variablenpfad den Array-Index, zum Beispiel `b.0.c` und `b.1.c`.

![20250113184056](https://static-docs.nocobase.com/20250113184056.png)

Wenn Array-Indizes enthalten sind, müssen Sie sicherstellen, dass die Array-Indizes in den Eingabedaten konsistent sind; andernfalls führt dies zu einem Parsing-Fehler.

## Verwendung in nachfolgenden Knoten

In der Konfiguration nachfolgender Knoten können Sie die vom JSON-Variablen-Mapping-Knoten generierten Variablen verwenden:

![20250113203658](https://static-docs.nocobase.com/20250113203658.png)

Obwohl die JSON-Struktur komplex sein kann, müssen Sie nach dem Mapping lediglich die Variable für den entsprechenden Pfad auswählen.