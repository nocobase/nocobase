:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Avancerat

## Introduktion

De flesta stora språkmodeller kan använda verktyg. AI-medarbetar-pluginet innehåller flera vanliga verktyg som språkmodellerna kan använda.

De färdigheter ni ställer in på inställningssidan för AI-medarbetare är de verktyg som språkmodellen kan använda.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## Ställa in färdigheter

Gå till konfigurationssidan för AI-medarbetar-pluginet. Klicka på fliken `AI employees` för att komma till hanteringssidan för AI-medarbetare.

Välj den AI-medarbetare ni vill ställa in färdigheter för och klicka på knappen `Edit` för att komma till redigeringssidan för AI-medarbetare.

På fliken `Skills` klickar ni på knappen `Add Skill` för att lägga till en färdighet för den aktuella AI-medarbetaren.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## Introduktion till färdigheter

### Frontend

Frontend-gruppen gör det möjligt för AI-medarbetaren att interagera med frontend-komponenter.

- Färdigheten `Form filler` gör att AI-medarbetaren kan fylla i genererad formulärdata i ett formulär som användaren har specificerat.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Datamodellering

Färdighetsgruppen Datamodellering ger AI-medarbetaren förmågan att anropa NocoBase interna API:er för datamodellering.

- `Intent Router` dirigerar avsikter och avgör om användaren vill ändra en samlingsstruktur eller skapa en ny.
- `Get collection names` hämtar namnen på alla befintliga samlingar i systemet.
- `Get collection metadata` hämtar strukturinformationen för en specificerad samling.
- `Define collections` gör det möjligt för AI-medarbetaren att skapa samlingar i systemet.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow caller

`Workflow caller` ger AI-medarbetaren förmågan att exekvera arbetsflöden. Arbetsflöden som konfigurerats med `Trigger type` som `AI employee event` i arbetsflödes-pluginet kommer att finnas tillgängliga här som färdigheter för AI-medarbetaren att använda.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Kodredigerare

Färdigheterna under gruppen Kodredigerare gör det främst möjligt för AI-medarbetaren att interagera med kodredigeraren.

- `Get code snippet list` hämtar listan över förinställda kodsnuttar.
- `Get code snippet content` hämtar innehållet i en specificerad kodsnutt.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Övrigt

- `Chart generator` ger AI-medarbetaren förmågan att generera diagram och mata ut dem direkt i konversationen.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)