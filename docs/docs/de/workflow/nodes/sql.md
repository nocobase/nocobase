---
pkg: '@nocobase/plugin-workflow-sql'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# SQL-Aktion

## Einführung

In einigen speziellen Szenarien können die oben genannten einfachen Aktionsknoten für Sammlungen möglicherweise keine komplexen Operationen bewältigen. In solchen Fällen können Sie den SQL-Knoten direkt nutzen, um die Datenbank komplexe SQL-Anweisungen zur Datenbearbeitung ausführen zu lassen.

Der Unterschied zu einer direkten Verbindung zur Datenbank für SQL-Operationen außerhalb der Anwendung besteht darin, dass Sie innerhalb eines Workflows Variablen aus dem Prozesskontext als Parameter in der SQL-Anweisung nutzen können.

## Installation

Dies ist ein integriertes Plugin, das keine Installation erfordert.

## Knoten erstellen

Klicken Sie in der Workflow-Konfiguration auf die Plus-Schaltfläche („+“) im Ablauf, um einen „SQL-Aktion“-Knoten hinzuzufügen:

![SQL-Aktion hinzufügen](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Knotenkonfiguration

![SQL-Knoten_Knotenkonfiguration](https://static-docs.nocobase.com/20240904002334.png)

### Datenquelle

Wählen Sie die Datenquelle aus, auf der die SQL-Anweisung ausgeführt werden soll.

Die Datenquelle muss eine Datenbank-Datenquelle sein, wie zum Beispiel die Hauptdatenquelle, PostgreSQL oder andere Sequelize-kompatible Datenquellen.

### SQL-Inhalt

Bearbeiten Sie die SQL-Anweisung. Derzeit wird nur eine SQL-Anweisung unterstützt.

Fügen Sie die benötigten Variablen über die Schaltfläche für Variablen in der oberen rechten Ecke des Editors ein. Vor der Ausführung werden diese Variablen durch Textersetzung mit ihren entsprechenden Werten ersetzt. Der so entstandene Text wird dann als endgültige SQL-Anweisung verwendet und zur Abfrage an die Datenbank gesendet.

## Ergebnis der Knotenausführung

Seit `v1.3.15-beta` ist das Ergebnis einer SQL-Knotenausführung ein Array aus reinen Daten. Zuvor war es die native Sequelize-Rückgabestruktur, die Abfrage-Metadaten enthielt (siehe: [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Zum Beispiel die folgende Abfrage:

```sql
select count(id) from posts;
```

Ergebnis vor `v1.3.15-beta`:

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

Ergebnis nach `v1.3.15-beta`:

```json
[
    { "count": 1 }
]
```

## Häufig gestellte Fragen

### Wie verwende ich das Ergebnis eines SQL-Knotens?

Wenn eine `SELECT`-Anweisung verwendet wird, wird das Abfrageergebnis im Knoten im JSON-Format von Sequelize gespeichert. Es kann mit dem [JSON-query](./json-query.md) Plugin analysiert und verwendet werden.

### Löst die SQL-Aktion Sammlungsereignisse aus?

**Nein**. Die SQL-Aktion sendet die SQL-Anweisung direkt zur Verarbeitung an die Datenbank. Die zugehörigen `CREATE` / `UPDATE` / `DELETE` Operationen finden in der Datenbank statt, während Sammlungsereignisse auf der Anwendungsebene von Node.js (ORM-Verarbeitung) auftreten. Daher werden keine Sammlungsereignisse ausgelöst.