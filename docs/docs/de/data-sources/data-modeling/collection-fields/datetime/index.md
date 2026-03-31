:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Übersicht

## Datums- und Uhrzeitfeldtypen

Datums- und Uhrzeitfeldtypen umfassen die folgenden Varianten:

- **Datum und Uhrzeit (mit Zeitzone)**: Datum und Uhrzeit werden einheitlich in UTC (Koordinierte Weltzeit) umgewandelt und bei Bedarf an die Zeitzone angepasst.
- **Datum und Uhrzeit (ohne Zeitzone)**: Speichert Datum und Uhrzeit ohne Zeitzoneninformationen.
- **Datum (ohne Uhrzeit)**: Speichert nur das Datum, ohne den Zeitanteil.
- **Uhrzeit**: Speichert nur die Uhrzeit, ohne den Datumsanteil.
- **Unix-Timestamp**: Wird als Unix-Timestamp gespeichert, typischerweise als die Anzahl der Sekunden seit dem 1. Januar 1970.

Hier sind Beispiele für die verschiedenen Datums- und Uhrzeitfeldtypen:

| **Feldtyp**                      | **Beispielwert**           | **Beschreibung**                                           |
|----------------------------------|----------------------------|------------------------------------------------------------|
| Datum und Uhrzeit (mit Zeitzone) | 2024-08-24T07:30:00.000Z   | Datum und Uhrzeit werden einheitlich in UTC (Koordinierte Weltzeit) umgewandelt. |
| Datum und Uhrzeit (ohne Zeitzone)| 2024-08-24 15:30:00        | Datum und Uhrzeit ohne Zeitzone, es werden nur Datum und Uhrzeit erfasst. |
| Datum (ohne Uhrzeit)             | 2024-08-24                 | Speichert nur die Datumsangabe, ohne Uhrzeit.              |
| Uhrzeit                          | 15:30:00                   | Speichert nur die Uhrzeitangabe, ohne Datum.               |
| Unix-Timestamp                   | 1724437800                 | Die Anzahl der Sekunden, die seit dem 1. Januar 1970, 00:00:00 UTC vergangen sind. |

## Vergleich der Datenquellen

Hier ist eine Vergleichstabelle für NocoBase, MySQL und PostgreSQL:

| **Feldtyp**                      | **NocoBase**               | **MySQL**                  | **PostgreSQL**                         |
|----------------------------------|----------------------------|----------------------------|----------------------------------------|
| Datum und Uhrzeit (mit Zeitzone) | Datetime with timezone     | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE               |
| Datum und Uhrzeit (ohne Zeitzone)| Datetime without timezone  | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE            |
| Datum (ohne Uhrzeit)             | Date                       | DATE                       | DATE                                   |
| Uhrzeit                          | Time                       | TIME                       | TIME WITHOUT TIME ZONE                 |
| Unix-Timestamp                   | Unix timestamp             | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                     |
| Uhrzeit (mit Zeitzone)           | -                          | -                          | TIME WITH TIME ZONE                    |

**Hinweis:**
- Der Datenbereich des MySQL TIMESTAMP-Typs liegt zwischen `1970-01-01 00:00:01 UTC` und `2038-01-19 03:14:07 UTC`. Wenn Sie Daten außerhalb dieses Bereichs speichern müssen, empfehlen wir die Verwendung von DATETIME oder BIGINT für Unix-Timestamps.

## Verarbeitungsworkflow für die Speicherung von Datum und Uhrzeit

### Mit Zeitzone

Dies umfasst `Datum und Uhrzeit (mit Zeitzone)` und `Unix-Timestamp`.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

**Hinweis:**
- Um einen größeren Datumsbereich zu unterstützen, verwendet NocoBase für Datums- und Uhrzeitfelder (mit Zeitzone) in MySQL den Typ DATETIME. Der gespeicherte Datumswert wird basierend auf der TZ-Umgebungsvariable des Servers konvertiert. Wenn sich diese Variable ändert, ändert sich auch der gespeicherte Datums- und Uhrzeitwert.
- Da es einen Zeitzonenunterschied zwischen UTC und der lokalen Zeit gibt, könnte die direkte Anzeige des ursprünglichen UTC-Wertes zu Missverständnissen bei den Benutzern führen.

### Ohne Zeitzone

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Koordinierte Weltzeit, Coordinated Universal Time) ist der globale Zeitstandard, der zur Koordination und Vereinheitlichung der Zeit weltweit verwendet wird. Es handelt sich um einen hochpräzisen Zeitstandard, der auf Atomuhren basiert und mit der Erdrotation synchronisiert ist.

Der Unterschied zwischen UTC und der lokalen Zeit kann zu Verwirrung führen, wenn die ursprünglichen UTC-Werte direkt angezeigt werden. Zum Beispiel:

| **Zeitzone** | **Datum und Uhrzeit** |
|--------------|-----------------------|
| UTC          | 2024-08-24T07:30:00.000Z |
| UTC+8        | 2024-08-24 15:30:00   |
| UTC+5        | 2024-08-24 12:30:00   |
| UTC-5        | 2024-08-24 02:30:00   |
| UTC+0        | 2024-08-24 07:30:00   |
| UTC-6        | 2024-08-23 01:30:00   |

Alle oben genannten Zeiten stellen denselben Zeitpunkt dar, lediglich in unterschiedlichen Zeitzonen ausgedrückt.