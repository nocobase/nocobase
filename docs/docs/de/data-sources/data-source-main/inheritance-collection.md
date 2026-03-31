---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Sammlungsvererbung

## Einführung

:::warning
Diese Funktion wird nur unterstützt, wenn Ihre Haupt-Datenbank PostgreSQL ist.
:::

Sie können eine Eltern-Sammlung erstellen und Kind-Sammlungen von dieser Eltern-Sammlung ableiten. Die Kind-Sammlung erbt die Struktur der Eltern-Sammlung und kann zusätzlich eigene Spalten definieren. Dieses Entwurfsmuster hilft Ihnen, Daten mit ähnlichen Strukturen, aber möglichen Unterschieden zu organisieren und zu verwalten.

Im Folgenden finden Sie einige gängige Merkmale von Sammlungsvererbung:

- Eltern-Sammlung: Die Eltern-Sammlung enthält allgemeine Spalten und Daten und definiert die grundlegende Struktur der gesamten Vererbungshierarchie.
- Kind-Sammlung: Die Kind-Sammlung erbt die Struktur der Eltern-Sammlung, kann aber auch zusätzliche eigene Spalten definieren. Dies ermöglicht es jeder Kind-Sammlung, die allgemeinen Eigenschaften der Eltern-Sammlung zu besitzen und gleichzeitig spezifische Attribute der Unterklasse zu enthalten.
- Abfragen: Beim Abfragen können Sie wählen, ob Sie die gesamte Vererbungshierarchie, nur die Eltern-Sammlung oder eine spezifische Kind-Sammlung abfragen möchten. Dies ermöglicht es Ihnen, Daten auf verschiedenen Ebenen nach Bedarf abzurufen und zu verarbeiten.
- Vererbungsbeziehung: Zwischen der Eltern-Sammlung und der Kind-Sammlung wird eine Vererbungsbeziehung hergestellt. Dies bedeutet, dass die Struktur der Eltern-Sammlung verwendet werden kann, um konsistente Attribute zu definieren, während die Kind-Sammlung diese Attribute erweitern oder überschreiben kann.

Dieses Entwurfsmuster hilft, Datenredundanz zu reduzieren, das Datenbankmodell zu vereinfachen und die Datenpflege zu erleichtern. Es sollte jedoch mit Vorsicht verwendet werden, da Vererbungs-Sammlungen die Komplexität von Abfragen erhöhen können, insbesondere wenn die gesamte Vererbungshierarchie verarbeitet wird. Datenbanken, die Vererbungs-Sammlungen unterstützen, bieten in der Regel spezifische Syntax und Werkzeuge zur Verwaltung und Abfrage solcher Sammlungsstrukturen.

## Benutzerhandbuch

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)