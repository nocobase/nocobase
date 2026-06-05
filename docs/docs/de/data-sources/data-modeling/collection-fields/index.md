:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Sammlungsfelder

## Interface-Typen von Feldern

NocoBase klassifiziert Felder aus Interface-Sicht in die folgenden Kategorien:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Felddatentypen

Jedes Feld-Interface besitzt einen Standard-Datentyp. Zum Beispiel ist für Felder, deren Interface ein Zahlen-Typ (Number) ist, der Standard-Datentyp `double`. Es können aber auch `float`, `decimal` usw. verwendet werden. Die aktuell unterstützten Datentypen sind:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Feldtyp-Mapping

Der Prozess zum Hinzufügen neuer Felder zur Hauptdatenbank ist wie folgt:

1. Wählen Sie den Interface-Typ aus.
2. Konfigurieren Sie den optionalen Datentyp für das aktuelle Interface.

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Der Prozess für das Feld-Mapping von externen Datenquellen ist:

1. Basierend auf dem Feldtyp der externen Datenbank werden der entsprechende Datentyp (Field type) und der UI-Typ (Field Interface) automatisch zugeordnet.
2. Passen Sie bei Bedarf den Datentyp und den Interface-Typ an, um eine bessere Übereinstimmung zu erzielen.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)