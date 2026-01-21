:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Overzicht

## Datum- en tijdveldtypen

De datum- en tijdveldtypen zijn als volgt:

- **Datum en tijd (met tijdzone)**: Deze waarden worden gestandaardiseerd naar UTC (Coordinated Universal Time) en worden waar nodig aangepast voor tijdzones.
- **Datum en tijd (zonder tijdzone)**: Dit type slaat datum- en tijdgegevens op zonder tijdzone-informatie.
- **Datum (zonder tijd)**: Dit formaat slaat uitsluitend datuminformatie op, zonder tijdcomponent.
- **Tijd**: Slaat alleen tijdinformatie op, exclusief de datum.
- **Unix-tijdstempel**: Dit type vertegenwoordigt het aantal seconden dat is verstreken sinds 1 januari 1970, en wordt opgeslagen als een Unix-tijdstempel.

Hier zijn voorbeelden van elk datum- en tijdgerelateerd veldtype:

| **Veldtype**                  | **Voorbeeldwaarde**          | **Beschrijving**                                       |
|-------------------------------|------------------------------|--------------------------------------------------------|
| Datum en tijd (met tijdzone)  | 2024-08-24T07:30:00.000Z     | Wordt geconverteerd naar UTC en kan worden aangepast voor tijdzones. |
| Datum en tijd (zonder tijdzone) | 2024-08-24 15:30:00          | Slaat datum en tijd op zonder tijdzone-overwegingen.   |
| Datum (zonder tijd)           | 2024-08-24                   | Legt alleen de datum vast, zonder tijdinformatie.      |
| Tijd                          | 15:30:00                     | Legt alleen de tijd vast, exclusief eventuele datumdetails. |
| Unix-tijdstempel              | 1724437800                   | Vertegenwoordigt seconden sinds 1970-01-01 00:00:00 UTC. |

## Vergelijking van gegevensbronnen

Hieronder vindt u een vergelijkingstabel voor NocoBase, MySQL en PostgreSQL:

| **Veldtype**                  | **NocoBase**               | **MySQL**                  | **PostgreSQL**                         |
|-------------------------------|----------------------------|----------------------------|----------------------------------------|
| Datum en tijd (met tijdzone)  | Datetime with timezone     | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE               |
| Datum en tijd (zonder tijdzone) | Datetime without timezone  | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE            |
| Datum (zonder tijd)           | Date                       | DATE                       | DATE                                   |
| Tijd                          | Time                       | TIME                       | TIME WITHOUT TIME ZONE                 |
| Unix-tijdstempel              | Unix timestamp             | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                     |
| Tijd (met tijdzone)           | -                          | -                          | TIME WITH TIME ZONE                    |

**Opmerking:**
- Het TIMESTAMP-type van MySQL bestrijkt een bereik tussen `1970-01-01 00:00:01 UTC` en `2038-01-19 03:14:07 UTC`. Voor datums en tijden buiten dit bereik wordt aangeraden om DATETIME of BIGINT te gebruiken voor het opslaan van Unix-tijdstempels.

## Verwerkingsworkflow voor datum- en tijdopslag

### Met tijdzone

Dit omvat `Datum en tijd (met tijdzone)` en `Unix-tijdstempel`.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

**Opmerking:**
- Om een breder scala aan datums te ondersteunen, gebruikt NocoBase het DATETIME-type in MySQL voor datum- en tijdvelden (met tijdzone). De opgeslagen datumwaarde wordt geconverteerd op basis van de TZ-omgevingsvariabele van de server, wat betekent dat als de TZ-omgevingsvariabele verandert, de opgeslagen datum- en tijdwaarde ook zal veranderen.
- Aangezien er een tijdzoneverschil is tussen UTC en lokale tijd, kan het direct weergeven van de ruwe UTC-waarde leiden tot verwarring bij de gebruiker.

### Zonder tijdzone

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Coordinated Universal Time) is de wereldwijde tijdstandaard die wordt gebruikt om de tijd wereldwijd te coördineren en te synchroniseren. Het is een zeer nauwkeurige tijdstandaard, onderhouden door atoomklokken, en gesynchroniseerd met de rotatie van de aarde.

Het verschil tussen UTC en lokale tijd kan leiden tot verwarring wanneer ruwe UTC-waarden direct worden weergegeven. Bijvoorbeeld:

| **Tijdzone** | **Datum en tijd**                |
|--------------|----------------------------------|
| UTC          | 2024-08-24T07:30:00.000Z         |
| UTC+8        | 2024-08-24 15:30:00              |
| UTC+5        | 2024-08-24 12:30:00              |
| UTC-5        | 2024-08-24 02:30:00              |
| UTC+0        | 2024-08-24 07:30:00              |
| UTC-6        | 2024-08-23 01:30:00              |

Deze verschillende tijden komen allemaal overeen met hetzelfde moment, alleen uitgedrukt in verschillende tijdzones.