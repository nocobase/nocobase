:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Flergrenat villkor <Badge>v2.0.0+</Badge>

## Introduktion

Liknar `switch / case`- eller `if / else if`-satser i programmeringsspråk. Systemet utvärderar de konfigurerade villkoren sekventiellt. När ett villkor är uppfyllt, exekveras arbetsflödet i den motsvarande grenen, och efterföljande villkorskontroller hoppas över. Om inga villkor uppfylls, exekveras grenen 'Annars'.

## Skapa nod

I arbetsflödets konfigurationsgränssnitt klickar ni på plusknappen ('+') i flödet för att lägga till en nod för 'Flergrenat villkor'.

![Skapa nod för flergrenat villkor](https://static-docs.nocobase.com/20251123222134.png)

## Grenhantering

### Standardgrenar

Efter att noden har skapats inkluderar den som standard två grenar:

1.  **Villkorsgren**: Här konfigurerar ni specifika bedömningsvillkor.
2.  **Annars-gren**: Denna gren aktiveras när inga villkorsgrenar uppfylls och kräver ingen villkorskonfiguration.

Klicka på knappen 'Lägg till gren' under noden för att lägga till fler villkorsgrenar.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Lägg till gren

Efter att ni har klickat på 'Lägg till gren' läggs den nya grenen till före 'Annars'-grenen.

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Ta bort gren

När det finns flera villkorsgrenar kan ni klicka på papperskorgsikonen till höger om en gren för att ta bort den. Om endast en villkorsgren återstår kan den inte tas bort.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Obs!}
Att ta bort en gren kommer också att ta bort alla noder inom den, så var försiktig.

'Annars'-grenen är en inbyggd gren och kan inte tas bort.
:::

## Nodkonfiguration

### Villkorskonfiguration

Klicka på villkorsnamnet högst upp i en gren för att redigera specifika villkorsdetaljer:

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Villkorsetikett

Stöder anpassade etiketter. När en etikett har fyllts i visas den som villkorsnamnet i flödesschemat. Om den inte konfigureras (eller lämnas tom) visas den som standard som 'Villkor 1', 'Villkor 2' osv., i sekvens.

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Beräkningsmotor

För närvarande stöds tre motorer:

-   **Grundläggande**: Använder enkla logiska jämförelser (t.ex. lika med, innehåller) och 'OCH'/'ELLER'-kombinationer för att fastställa resultat.
-   **Math.js**: Stöder uttrycksberäkning med [Math.js](https://mathjs.org/)-syntax.
-   **Formula.js**: Stöder uttrycksberäkning med [Formula.js](https://formulajs.info/)-syntax (liknar Excel-formler).

Alla tre lägena stöder användning av arbetsflödets kontextvariabler som parametrar.

### När inga villkor uppfylls

I nodens konfigurationspanel kan ni ställa in den efterföljande åtgärden när inga villkor uppfylls:

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

*   **Avsluta arbetsflödet med fel (standard)**: Markerar arbetsflödets status som misslyckad och avslutar processen.
*   **Fortsätt att exekvera efterföljande noder**: Efter att den aktuella noden har slutförts fortsätter arbetsflödet att exekvera efterföljande noder.

:::info{title=Obs!}
Oavsett vilken hanteringsmetod som väljs, när inga villkor uppfylls, kommer flödet först att gå in i 'Annars'-grenen för att exekvera noderna där.
:::

## Exekveringshistorik

I arbetsflödets exekveringshistorik identifierar noden för flergrenat villkor resultatet av varje villkor med olika färger:

-   **Grön**: Villkor uppfyllt; gick in i denna gren för exekvering.
-   **Röd**: Villkor ej uppfyllt (eller beräkningsfel); denna gren hoppades över.
-   **Blå**: Bedömning ej utförd (hoppades över eftersom ett föregående villkor redan var uppfyllt).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Om ett konfigurationsfel orsakar ett beräkningsundantag för villkoret, kommer, förutom att visas som rött, specifik felinformation att visas när ni håller muspekaren över villkorsnamnet:

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

När ett villkorsberäkningsundantag inträffar kommer noden för flergrenat villkor att avslutas med statusen 'Fel' och kommer inte att fortsätta exekvera efterföljande noder.