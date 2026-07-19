---
title: "Übersicht"
description: "Datums- und Uhrzeitfeldtypen: mit/ohne Zeitzone, Datum, Uhrzeit, Unix-Zeitstempel sowie der Vergleich der NocoBase-/MySQL-/PostgreSQL-Typen."
keywords: "Datum und Uhrzeit,DateTime,Zeitfeld,mit Zeitzone,ohne Zeitzone,Unix-Zeitstempel,NocoBase"
---

# Übersicht

## Datums- und Uhrzeitfeldtypen

Zu den Datums- und Uhrzeitfeldtypen gehören:

- **Datum und Uhrzeit (mit Zeitzone)** – Datum und Uhrzeit werden einheitlich in UTC (koordinierte Weltzeit) umgewandelt und bei Bedarf in die entsprechende Zeitzone konvertiert;
- **Datum und Uhrzeit (ohne Zeitzone)** – speichert Datum und Uhrzeit ohne Zeitzoneninformationen;
- **Datum (ohne Uhrzeit)** – speichert ausschließlich das Datum ohne Zeitangabe;
- **Uhrzeit** – speichert ausschließlich die Uhrzeit ohne Datumsangabe;
- **Unix-Zeitstempel** – wird als Unix-Zeitstempel gespeichert, in der Regel als Anzahl der Sekunden seit dem 1. Januar 1970.

Beispiele für die verschiedenen datumsbezogenen Feldtypen:

| **Feldtyp**                 | **Beispielwert**            | **Beschreibung**                                      |
|-----------------------------|-----------------------------|-------------------------------------------------------|
| Datum und Uhrzeit (mit Zeitzone)   | 2024-08-24T07:30:00.000Z   | Datum und Uhrzeit werden einheitlich in UTC (koordinierte Weltzeit) umgewandelt |
| Datum und Uhrzeit (ohne Zeitzone) | 2024-08-24 15:30:00        | Datum und Uhrzeit ohne Zeitzone; nur Datum und Uhrzeit werden erfasst |
| Datum (ohne Uhrzeit)         | 2024-08-24                  | Speichert ausschließlich Datumsinformationen ohne Uhrzeit |
| Uhrzeit                     | 15:30:00                   | Speichert ausschließlich Uhrzeitinformationen ohne Datum |
| Unix-Zeitstempel             | 1724437800                 | Anzahl der seit dem 1. Januar 1970 um 00:00:00 UTC vergangenen Sekunden |

## Vergleich der Datenquellen

Vergleichstabelle für NocoBase, MySQL und PostgreSQL:

| **Feldtyp**                 | **NocoBase**                 | **MySQL**          | **PostgreSQL**                |
|-----------------------------|------------------------------|--------------------|-------------------------------|
| Datum und Uhrzeit (mit Zeitzone)   | Datetime with timezone     | TIMESTAMP<br/> DATETIME | TIMESTAMP WITH TIME ZONE      |
| Datum und Uhrzeit (ohne Zeitzone) | Datetime without timezone  | DATETIME           | TIMESTAMP WITHOUT TIME ZONE   |
| Datum (ohne Uhrzeit)         | Date                       | DATE               | DATE                          |
| Uhrzeit                     | Time                       | TIME               | TIME WITHOUT TIME ZONE        |
| Unix-Zeitstempel             | Unix timestamp              | INTEGER<br/>BIGINT   | INTEGER<br/>BIGINT              |
| Uhrzeit (mit Zeitzone)       | -                          | -                  | TIME WITH TIME ZONE           |

Hinweis:
- Der Wertebereich von MySQL TIMESTAMP liegt zwischen UTC `1970-01-01 00:00:01 ~ 2038-01-19 03:14:07`. Außerhalb dieses Bereichs wird empfohlen, DATETIME oder BIGINT zur Speicherung von Unix-Zeitstempeln zu verwenden.

## Verarbeitung der Speicherung von Datum und Uhrzeit

### Mit Zeitzone

Umfasst `日期时间（不含时区）` und `Unix 时间戳`

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

Hinweis:
- Um einen größeren Wertebereich zu unterstützen, verwendet das Feld für Datum und Uhrzeit (mit Zeitzone) von NocoBase in MySQL DATETIME. Der gespeicherte Datumswert wird anhand der TZ-Umgebungsvariable des Servers umgerechnet. Wird die TZ-Umgebungsvariable geändert, kann sich der gespeicherte Datums- und Uhrzeitwert ändern.
- Zwischen UTC und der lokalen Zeit besteht ein Zeitzonenunterschied. Die direkte Anzeige des ursprünglichen UTC-Werts kann bei Benutzern zu Missverständnissen führen.

### Ohne Zeitzone

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (koordinierte Weltzeit, Coordinated Universal Time) ist der weltweite Zeitstandard zur Koordination und Vereinheitlichung der Zeit auf der ganzen Welt. Sie basiert auf einer hochpräzisen Zeitmessung durch Atomuhren und bleibt mit der Erdrotation synchronisiert.

Zwischen UTC und der lokalen Zeit besteht ein Zeitzonenunterschied. Die direkte Anzeige des ursprünglichen UTC-Werts kann bei Benutzern zu Missverständnissen führen, zum Beispiel:

| **Zeitzone**       | **Datum und Uhrzeit**             |
|--------------------|-----------------------------------|
| UTC                | 2024-08-24T07:30:00.000Z         |
| UTC+8              | 2024-08-24 15:30:00              |
| UTC+5              | 2024-08-24 12:30:00              |
| UTC-5              | 2024-08-24 02:30:00              |
| Britische Zeit (UTC+0) | 2024-08-24 07:30:00           |
| Zentraleuropäische Zeit (UTC-6) | 2024-08-23 01:30:00 |

Alle oben dargestellten Werte beziehen sich auf denselben Zeitpunkt; lediglich die Zeitzonen unterscheiden sich.
