---
pkg: '@nocobase/plugin-user-data-sync'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Gebruikersgegevenssynchronisatie

## Introductie

Deze functie stelt u in staat om bronnen voor gebruikersgegevenssynchronisatie te registreren en te beheren. Standaard is er een HTTP API beschikbaar, en andere gegevensbronnen kunnen via plugins worden uitgebreid. Het ondersteunt standaard het synchroniseren van gegevens naar de **gebruikers**- en **afdelingen**-collecties, en andere synchronisatiedoelbronnen kunnen ook via plugins worden uitgebreid.

## Gegevensbronbeheer en -synchronisatie

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Als er geen plugins zijn geïnstalleerd die bronnen voor gebruikersgegevenssynchronisatie aanbieden, kunt u gebruikersgegevens synchroniseren via de HTTP API. Raadpleeg [Gegevensbron - HTTP API](./sources/api.md).
:::

## Een gegevensbron toevoegen

Nadat u een plugin heeft geïnstalleerd die een bron voor gebruikersgegevenssynchronisatie aanbiedt, kunt u de bijbehorende gegevensbron toevoegen. Alleen ingeschakelde gegevensbronnen tonen de knoppen 'Synchroniseren' en 'Taak'.

> Voorbeeld: WeCom

![](https://static-docs.nocobase.com/202412041053785.png)

## Gegevens synchroniseren

Klik op de knop 'Synchroniseren' om de gegevenssynchronisatie te starten.

![](https://static-docs.nocobase.com/202412041055022.png)

Klik op de knop 'Taak' om de synchronisatiestatus te bekijken. Na een succesvolle synchronisatie kunt u de gegevens bekijken in de lijsten van gebruikers en afdelingen.

![](https://static-docs.nocobase.com/202412041202337.png)

Bij mislukte synchronisatietaken kunt u op 'Opnieuw proberen' klikken.

![](https://static-docs.nocobase.com/202412041058337.png)

Als de synchronisatie mislukt, kunt u de oorzaak achterhalen via de systeemlogboeken. Daarnaast worden de originele synchronisatierecords opgeslagen in de map `user-data-sync` binnen de applicatielogboekenmap.

![](https://static-docs.nocobase.com/202412041205655.png)