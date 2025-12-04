:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Översikt

## Datum- och tidsfältstyper

Datum- och tidsfältstyperna inkluderar följande:

- **Datum och tid (med tidszon)** – Datum och tid konverteras till UTC (Coordinated Universal Time) och justeras för tidszon vid behov.
- **Datum och tid (utan tidszon)** – Lagrar datum- och tidsinformation utan tidszonsinformation.
- **Datum (utan tid)** – Lagrar endast datuminformation, utan tidsdel.
- **Tid** – Lagrar endast tidsinformation, utan datumdel.
- **Unix-tidsstämpel** – Lagras som en Unix-tidsstämpel, vilket vanligtvis är antalet sekunder sedan 1 januari 1970.

Här är exempel för varje datum- och tidsrelaterad fälttyp:

| **Fälttyp**                 | **Exempelvärde**           | **Beskrivning**                                       |
|-----------------------------|----------------------------|-------------------------------------------------------|
| Datum och tid (med tidszon) | 2024-08-24T07:30:00.000Z   | Konverteras till UTC (Coordinated Universal Time) och kan justeras för tidszoner. |
| Datum och tid (utan tidszon)| 2024-08-24 15:30:00        | Lagrar datum och tid utan hänsyn till tidszoner.      |
| Datum (utan tid)            | 2024-08-24                 | Fångar endast datumet, utan tidsinformation.          |
| Tid                         | 15:30:00                   | Fångar endast tiden, utan datumdetaljer.              |
| Unix-tidsstämpel            | 1724437800                 | Representerar sekunder sedan 1970-01-01 00:00:00 UTC. |

## Jämförelse mellan datakällor

Här är en jämförelsetabell för NocoBase, MySQL och PostgreSQL:

| **Fälttyp**                 | **NocoBase**               | **MySQL**                  | **PostgreSQL**                         |
|-----------------------------|----------------------------|----------------------------|----------------------------------------|
| Datum och tid (med tidszon) | Datetime with timezone     | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE               |
| Datum och tid (utan tidszon)| Datetime without timezone  | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE            |
| Datum (utan tid)            | Date                       | DATE                       | DATE                                   |
| Tid                         | Time                       | TIME                       | TIME WITHOUT TIME ZONE                 |
| Unix-tidsstämpel            | Unix timestamp             | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                     |
| Tid (med tidszon)           | -                          | -                          | TIME WITH TIME ZONE                    |

**Obs!**
- MySQL:s `TIMESTAMP`-typ täcker ett intervall mellan `1970-01-01 00:00:01 UTC` och `2038-01-19 03:14:07 UTC`. För datum och tider utanför detta intervall rekommenderar vi att du använder `DATETIME` eller `BIGINT` för att lagra Unix-tidsstämplar.

## Hanteringsflöde för lagring av datum och tid

### Med tidszon

Detta inkluderar `Datum och tid (med tidszon)` och `Unix-tidsstämpel`.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

**Obs!**
- För att hantera ett bredare datumintervall använder NocoBase `DATETIME`-typen i MySQL för fält av typen Datum och tid (med tidszon). Det lagrade datumvärdet konverteras baserat på serverns `TZ`-miljövariabel, vilket innebär att om `TZ`-miljövariabeln ändras, kommer även det lagrade datum- och tidsvärdet att ändras.
- Eftersom det finns en tidszonskillnad mellan UTC och lokal tid, kan en direkt visning av det råa UTC-värdet leda till förvirring för användaren.

### Utan tidszon

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Coordinated Universal Time) är den globala tidsstandarden som används för att koordinera och synkronisera tid över hela världen. Det är en mycket exakt tidsstandard, upprätthållen av atomur, och synkroniserad med jordens rotation.

Skillnaden mellan UTC och lokal tid kan orsaka förvirring när råa UTC-värden visas direkt. Till exempel:

| **Tidszon**         | **Datum och tid**               |
|---------------------|---------------------------------|
| UTC                 | 2024-08-24T07:30:00.000Z        |
| UTC+8               | 2024-08-24 15:30:00             |
| UTC+5               | 2024-08-24 12:30:00             |
| UTC-5               | 2024-08-24 02:30:00             |
| UTC+0 (Storbritannien)| 2024-08-24 07:30:00             |
| UTC-6 (Centraltid)  | 2024-08-23 01:30:00             |

Dessa olika tider motsvarar alla samma ögonblick, men uttrycks i olika tidszoner.