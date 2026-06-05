---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# JSON Berechnung

## Einführung

Basierend auf verschiedenen JSON-Berechnungs-Engines berechnet oder transformiert dieser Knoten komplexe JSON-Daten, die von vorhergehenden Knoten erzeugt wurden, damit sie von nachfolgenden Knoten verwendet werden können. Zum Beispiel können die Ergebnisse von SQL-Operationen und HTTP-Anfrage-Knoten durch diesen Knoten in die benötigten Werte und Variablenformate umgewandelt werden, um von nachfolgenden Knoten genutzt zu werden.

## Knoten erstellen

In der Konfigurationsoberfläche des Workflows klicken Sie auf das Plus-Symbol („+“) im Prozess, um einen „JSON Berechnung“-Knoten hinzuzufügen:

![Knoten erstellen](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=Hinweis}
Normalerweise wird der JSON Berechnung-Knoten unterhalb anderer Datenknoten erstellt, um diese zu parsen.
:::

## Knotenkonfiguration

### Parsing-Engine

Der JSON Berechnung-Knoten unterstützt verschiedene Syntaxen durch unterschiedliche Parsing-Engines. Sie können basierend auf Ihren Präferenzen und den Besonderheiten der jeweiligen Engine wählen. Derzeit werden drei Parsing-Engines unterstützt:

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Engine-Auswahl](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Datenquelle

Die Datenquelle kann das Ergebnis eines vorhergehenden Knotens oder ein Datenobjekt im Workflow-Kontext sein. Dabei handelt es sich typischerweise um ein Datenobjekt ohne integrierte Struktur, wie zum Beispiel das Ergebnis eines SQL-Knotens oder eines HTTP-Anfrage-Knotens.

![Datenquelle](https://static-docs.nocobase.com/f5a79e20693b3d30b3a994a576aa282d.png)

:::info{title=Hinweis}
Normalerweise sind die Datenobjekte von Sammlung-bezogenen Knoten durch die Sammlung-Konfigurationsinformationen strukturiert und müssen in der Regel nicht durch den JSON Berechnung-Knoten geparst werden.
:::

### Parsing-Ausdruck

Benutzerdefinierte Parsing-Ausdrücke basierend auf den Parsing-Anforderungen und der gewählten Parsing-Engine.

![Parsing-Ausdruck](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=Hinweis}
Verschiedene Engines bieten unterschiedliche Parsing-Syntaxen. Details entnehmen Sie bitte der Dokumentation in den Links.
:::

Seit Version `v1.0.0-alpha.15` unterstützen Ausdrücke Variablen. Variablen werden vor der Ausführung durch die jeweilige Engine vorab geparst, wobei die Variablen gemäß den Regeln von String-Templates durch spezifische String-Werte ersetzt und mit anderen statischen Strings im Ausdruck zum finalen Ausdruck zusammengefügt werden. Diese Funktion ist sehr nützlich, wenn Sie Ausdrücke dynamisch erstellen müssen, zum Beispiel, wenn bestimmte JSON-Inhalte einen dynamischen Schlüssel zum Parsen benötigen.

### Eigenschaftszuordnung

Wenn das Berechnungsergebnis ein Objekt (oder ein Array von Objekten) ist, können Sie die benötigten Eigenschaften durch Eigenschaftszuordnung weiter als untergeordnete Variablen zuordnen, damit sie von nachfolgenden Knoten verwendet werden können.

![Eigenschaftszuordnung](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=Hinweis}
Bei einem Objekt (oder einem Array von Objekten) als Ergebnis wird, wenn keine Eigenschaftszuordnung vorgenommen wird, das gesamte Objekt (oder Array von Objekten) als einzelne Variable im Ergebnis des Knotens gespeichert, und die Eigenschaftswerte des Objekts können nicht direkt als Variablen verwendet werden.
:::

## Beispiel

Angenommen, die zu parsende Daten stammen von einem vorhergehenden SQL-Knoten, der zur Abfrage von Daten verwendet wird, und dessen Ergebnis ein Satz von Bestelldaten ist:

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

Wenn wir die Gesamtsumme der beiden Bestellungen in den Daten parsen und berechnen und diese zusammen mit der entsprechenden Bestell-ID zu einem Objekt zusammenfügen möchten, um den Gesamtpreis der Bestellung zu aktualisieren, können wir dies wie folgt konfigurieren:

![Beispiel - SQL-Konfiguration parsen](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. Wählen Sie die JSONata Parsing-Engine aus;
2. Wählen Sie das Ergebnis des SQL-Knotens als Datenquelle aus;
3. Verwenden Sie den JSONata-Ausdruck `$[0].{"id": id, "total": products.(price * quantity)}` zum Parsen;
4. Wählen Sie die Eigenschaftszuordnung, um `id` und `total` als untergeordnete Variablen zuzuordnen;

Das finale Parsing-Ergebnis sieht wie folgt aus:

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

Anschließend durchlaufen Sie das resultierende Bestell-Array, um den Gesamtpreis der Bestellungen zu aktualisieren.

![Gesamtpreis der entsprechenden Bestellung aktualisieren](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)