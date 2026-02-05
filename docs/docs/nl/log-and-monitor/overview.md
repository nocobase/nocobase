:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Serverlogboeken, auditlogboeken en recordgeschiedenis

## Serverlogboeken

### Systeemlogboeken

> Zie [Systeemlogboeken](#)

- Legt runtime-informatie van het applicatiesysteem vast, volgt de uitvoeringsketens van code en spoort uitzonderingen of runtime-fouten op.
- Logboeken worden gecategoriseerd op ernstniveaus en functionele modules.
- Worden via de terminal uitgevoerd of als bestanden opgeslagen.
- Hoofdzakelijk gebruikt om systeemfouten tijdens de werking te diagnosticeren en op te lossen.

### Verzoeklogboeken

> Zie [Verzoeklogboeken](#)

- Legt HTTP API-verzoek- en antwoordinformatie vast, met de nadruk op het vastleggen van de verzoek-ID, API-pad, headers, HTTP-statuscode en duur.
- Worden via de terminal uitgevoerd of als bestanden opgeslagen.
- Hoofdzakelijk gebruikt om API-aanroepen en de uitvoeringsprestaties te traceren.

## Auditlogboeken

> Zie [Auditlogboeken](../security/audit-logger/index.md)

- Legt gebruikers- (of API-)acties op systeemresources vast, met de nadruk op het type resource, het doelobject, het type bewerking, gebruikersinformatie en de status van de bewerking.
- Om beter te kunnen volgen wat gebruikers hebben gedaan en welke resultaten zijn geproduceerd, worden verzoekparameters en antwoorden opgeslagen als metadata. Dit overlapt gedeeltelijk met verzoeklogboeken, maar is niet identiek – zo bevatten verzoeklogboeken doorgaans geen volledige verzoekbody's.
- Verzoekparameters en antwoorden zijn **niet gelijkwaardig** aan datasnapshots. Ze kunnen onthullen welke soorten bewerkingen hebben plaatsgevonden, maar niet de exacte gegevens vóór de wijziging, en kunnen daarom niet worden gebruikt voor versiebeheer of het herstellen van gegevens na onjuiste bewerkingen.
- Opgeslagen als zowel bestanden als databasetabellen.

![](https://static-docs.nocobase.com/202501031627922.png)

## Recordgeschiedenis

> Zie [Recordgeschiedenis](/record-history/index.md)

- Legt de **wijzigingsgeschiedenis** van gegevensinhoud vast.
- Volgt het resourcetype, resourceobject, bewerkingstype, gewijzigde velden en de waarden voor en na de wijziging.
- Bruikbaar voor **gegevensvergelijking en auditing**.
- Opgeslagen in databasetabellen.

![](https://static-docs.nocobase.com/202511011338499.png)