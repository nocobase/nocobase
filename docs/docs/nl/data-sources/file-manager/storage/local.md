:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Lokale opslag

Geüploade bestanden worden opgeslagen in een lokale map op de server. Dit is geschikt voor kleinschalige of experimentele scenario's waarbij het totale aantal bestanden dat door het systeem wordt beheerd relatief klein is.

## Configuratieparameters

![Voorbeeld van configuratie van de bestandsopslag-engine](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Opmerking}
Deze sectie behandelt alleen de specifieke parameters voor de lokale opslag-engine. Voor algemene parameters verwijzen we u naar de [Algemene engineparameters](./index.md#algemene-engineparameters).
:::

### Pad

Het pad vertegenwoordigt zowel het relatieve pad van het bestand op de server als het URL-toegangspad. Bijvoorbeeld, "`user/avatar`" (zonder de beginnende en eindigende "`/`") staat voor:

1. Het relatieve pad van het geüploade bestand op de server: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Het URL-voorvoegsel voor toegang tot het bestand: `http://localhost:13000/storage/uploads/user/avatar`.