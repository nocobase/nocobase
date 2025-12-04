:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Collectieoverzicht

NocoBase biedt een unieke DSL (Domain-Specific Language) om de structuur van gegevens te beschrijven, die we een collectie noemen. Deze aanpak verenigt de datastructuren van diverse bronnen en legt zo een betrouwbare basis voor gegevensbeheer, -analyse en -toepassingen.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

Om diverse datamodellen gemakkelijk te kunnen gebruiken, ondersteunt NocoBase het aanmaken van verschillende soorten collecties:

- [Algemene collectie](/data-sources/data-source-main/general-collection): Met ingebouwde, veelgebruikte systeemvelden.
- [Overervingscollectie](/data-sources/data-source-main/inheritance-collection): U kunt een bovenliggende collectie aanmaken en daaruit een onderliggende collectie afleiden. De onderliggende collectie erft de structuur van de bovenliggende collectie en kan tegelijkertijd eigen kolommen definiëren.
- [Boomcollectie](/data-sources/collection-tree): Een collectie met een boomstructuur, die momenteel alleen het 'adjacency list'-ontwerp ondersteunt.
- [Kalendercollectie](/data-sources/calendar/calendar-collection): Voor het aanmaken van collecties voor kalendergerelateerde gebeurtenissen.
- [Bestandscollectie](/data-sources/file-manager/file-collection): Voor het beheer van bestandsopslag.
- : Voor scenario's met dynamische expressies in workflows.
- [SQL-collectie](/data-sources/collection-sql): Geen feitelijke databasecollectie, maar toont SQL-query's snel en gestructureerd.
- [View-collectie](/data-sources/collection-view): Maakt verbinding met bestaande database-views.
- [Externe collectie](/data-sources/collection-fdw): Stelt het databasesysteem in staat om gegevens in externe gegevensbronnen direct te benaderen en te bevragen, gebaseerd op FDW-technologie.