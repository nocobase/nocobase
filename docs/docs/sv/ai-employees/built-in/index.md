:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Inbyggda AI-medarbetare

## Översikt

NocoBase innehåller följande inbyggda AI-medarbetare. De är utrustade med kompletta färdigheter, verktyg och kunskapsbaser. Ni behöver bara konfigurera en LLM för dem för att de ska kunna börja arbeta.

- `Orin`: Expert på datamodellering
- `Avery`: Formulärifyllare
- `Viz`: Insiktsanalytiker
- `Lexi`: Översättare
- `Nathan`: Frontend-kodutvecklare
- `Cole`: NocoBase-assistent
- `Vera`: Forskningsanalytiker
- `Dex`: Dataorganisatör
- `Ellis`: E-postexpert

## Så här aktiverar ni

Gå till konfigurationssidan för `AI employees`-pluginen, klicka på fliken `AI employees` för att komma till sidan för hantering av AI-medarbetare.

Ni kan se att systemet har flera inbyggda AI-medarbetare, men ingen av dem är aktiverad. Ni kan ännu inte samarbeta med dessa AI-medarbetare på applikationssidan.

![20251022121248](https://static-docs.nocobase.com/20251022121248.png)

Välj den inbyggda AI-medarbetare ni vill aktivera, klicka på knappen `Edit` för att komma till redigeringssidan för AI-medarbetaren.

Först, på fliken `Profile`, slår ni på reglaget `Enable`.

![20251022121546](https://static-docs.nocobase.com/20251022121546.png)

Därefter, på fliken `Model settings`, ställer ni in modellen för den inbyggda AI-medarbetaren:

- Välj den LLM-tjänst som ni skapade i LLM-tjänsthanteringen;
- Ange namnet på den stora modell ni vill använda.

![20251022121729](https://static-docs.nocobase.com/20251022121729.png)

### Slutför aktiveringen

När ni har ställt in modellen för den inbyggda AI-medarbetaren, klickar ni på knappen `Submit` för att spara ändringarna.

Därefter kan ni se denna inbyggda AI-medarbetare i snabbstartsknappen för AI-medarbetare i sidans nedre högra hörn.

![20251022121951](https://static-docs.nocobase.com/20251022121951.png)

### Observera

Vissa inbyggda AI-medarbetare kommer inte att visas i listan över AI-medarbetare i det nedre högra hörnet efter att de har aktiverats. Till exempel kommer Orin endast att visas på huvudkonfigurationssidan för data; Nathan kommer endast att visas i JS-redigeraren.