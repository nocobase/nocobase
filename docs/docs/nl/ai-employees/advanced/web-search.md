:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Geavanceerd

## Introductie

Over het algemeen hebben grote taalmodellen (LLM's) vaak verouderde gegevens en missen ze de meest recente informatie. Daarom bieden online LLM-serviceplatforms meestal een webzoekfunctie aan. Hiermee kan de AI, voordat deze antwoordt, eerst informatie zoeken met behulp van tools en vervolgens reageren op basis van de zoekresultaten van die tools.

AI-medewerkers zijn aangepast om gebruik te maken van de webzoekfunctie van diverse online LLM-serviceplatforms. U kunt de webzoekfunctie inschakelen in de modelconfiguratie van de AI-medewerker en tijdens gesprekken.

## Webzoekfunctie inschakelen

Ga naar de configuratiepagina van de AI-medewerker plugin. Klik op het tabblad `AI employees` om de beheerpagina van de AI-medewerkers te openen.

![20251021225643](https://static-docs.nocobase.com/20251021225643.png)

Selecteer de AI-medewerker waarvoor u de webzoekfunctie wilt inschakelen. Klik op de knop `Edit` om de bewerkingspagina van de AI-medewerker te openen.

![20251022114043](https://static-docs.nocobase.com/20251022114043.png)

Schakel op het tabblad `Model settings` de schakelaar `Web Search` in. Klik vervolgens op de knop `Submit` om de wijzigingen op te slaan.

![20251022114300](https://static-docs.nocobase.com/20251022114300.png)

## De webzoekfunctie gebruiken in gesprekken

Zodra een AI-medewerker de webzoekfunctie heeft ingeschakeld, verschijnt er een 'Web'-icoon in het invoerveld van het gesprek. De webzoekfunctie is standaard ingeschakeld; u kunt erop klikken om deze uit te schakelen.

![20251022115110](https://static-docs.nocobase.com/20251022115110.png)

Wanneer de webzoekfunctie is ingeschakeld, toont het antwoord van de AI-medewerker de resultaten van de webzoekopdracht.

![20251022115502](https://static-docs.nocobase.com/20251022115502.png)

## Verschillen in webzoektools per platform

Momenteel is de webzoekfunctie van de AI-medewerker afhankelijk van het online LLM-serviceplatform dat u gebruikt. Hierdoor kan de gebruikerservaring verschillen. De specifieke verschillen vindt u hieronder:

| Platform  | Webzoekfunctie | tools | Realtime respons met zoektermen | Externe links als referentie in het antwoord |
| --------- | -------- | ----- | ------------------------------- | -------------------------------------------- |
| OpenAI    | ✅        | ✅     | ✅                              | ✅                                           |
| Gemini    | ✅        | ❌     | ❌                              | ✅                                           |
| Dashscope | ✅        | ✅     | ❌                              | ❌                                           |
| Deepseek  | ❌        | ❌     | ❌                              | ❌                                           |