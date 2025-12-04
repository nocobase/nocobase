:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Opslag-engine: Lokale opslag

Geüploade bestanden worden opgeslagen in een lokale map op de harde schijf van de server. Dit is geschikt voor situaties waarin het totale volume aan geüploade bestanden dat door het systeem wordt beheerd klein is, of voor experimentele doeleinden.

## Configuratieparameters

![Voorbeeld van de configuratie van de bestandsopslag-engine](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Opmerking}
Deze sectie introduceert alleen parameters die specifiek zijn voor de lokale opslag-engine. Voor algemene parameters verwijzen we u naar [Algemene engineparameters](./index.md#algemene-engineparameters).
:::

### Pad

Dit geeft zowel het relatieve pad voor bestandsopslag op de server als het URL-toegangspad aan. Bijvoorbeeld, "`user/avatar`" (zonder beginnende of eindigende schuine strepen) staat voor:

1. Het relatieve pad op de server waar geüploade bestanden worden opgeslagen: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Het URL-voorvoegsel voor toegang tot de bestanden: `http://localhost:13000/storage/uploads/user/avatar`.