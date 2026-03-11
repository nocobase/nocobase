:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/log-and-monitor/logger/overview) voor nauwkeurige informatie.
:::

# Serverlogs, auditlogs en recordgeschiedenis

## Serverlogs

### Systeemlogs

> Zie [Systeemlogs](./index.md#systeemlogs)

- Registreert runtime-informatie van het applicatiesysteem, volgt de uitvoeringsketens van de code en traceert uitzonderingen of runtimefouten.
- Logs zijn gecategoriseerd op ernstniveau en functionele modules.
- Uitvoer via de terminal of opgeslagen als bestanden.
- Hoofdzakelijk gebruikt voor het diagnosticeren en oplossen van systeemfouten tijdens bedrijf.

### Request-logs

> Zie [Request-logs](./index.md#request-logs)

- Registreert details van HTTP API-verzoeken en -antwoorden, met de nadruk op verzoek-ID, API-pad, headers, responsstatuscode en tijdsduur.
- Uitvoer via de terminal of opgeslagen als bestanden.
- Hoofdzakelijk gebruikt om API-aanroepen en uitvoeringsprestaties te volgen.

## Auditlogs

> Zie [Auditlogs](/security/audit-logger/index.md)

- Registreert acties van gebruikers (of API's) op systeembronnen, met de nadruk op brontype, doelobject, type bewerking, gebruikersinformatie en status van de bewerking.
- Om acties van gebruikers en de resultaten daarvan beter te kunnen volgen, worden verzoekparameters en antwoorden opgeslagen als metadata. Deze informatie overlapt gedeeltelijk met de request-logs, maar is niet identiek; request-logs bevatten bijvoorbeeld meestal niet de volledige inhoud van het verzoek (request body).
- Verzoekparameters en antwoorden zijn **niet hetzelfde** als gegevenssnapshots. Ze laten zien welke bewerkingen hebben plaatsgevonden, maar niet de exacte gegevens vóór de wijziging. Daarom kunnen ze niet worden gebruikt voor versiebeheer of het herstellen van gegevens na foutieve handelingen.
- Opgeslagen als zowel bestanden als databasetabellen.

![](https://static-docs.nocobase.com/202501031627922.png)

## Recordgeschiedenis

> Zie [Recordgeschiedenis](/record-history/index.md)

- Registreert de **wijzigingsgeschiedenis** van de gegevensinhoud.
- Houdt het brontype, bronobject, type bewerking, gewijzigde velden en de waarden van vóór en na de wijziging bij.
- Nuttig voor **gegevensvergelijking en auditing**.
- Opgeslagen in databasetabellen.

![](https://static-docs.nocobase.com/202511011338499.png)