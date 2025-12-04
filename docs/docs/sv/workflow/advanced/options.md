:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Avancerad konfiguration

## Utförandeläge

Arbetsflöden utförs antingen asynkront eller synkront, beroende på den utlösartyp som valts vid skapandet. Asynkront läge innebär att efter att en specifik händelse har utlösts, hamnar arbetsflödet i en kö och utförs ett efter ett av bakgrundsschemaläggning. Synkront läge däremot, går inte in i schemaläggningskön efter att det har utlösts; det börjar utföras direkt och ger omedelbar feedback när det är klart.

Samlingshändelser, händelser efter åtgärd, anpassade åtgärdshändelser, schemalagda händelser och godkännandehändelser utförs asynkront som standard. Händelser före åtgärd utförs synkront som standard. Både samlingshändelser och formulärhändelser stöder båda lägena, vilket kan väljas när ni skapar ett arbetsflöde:

![Sync Mode_Create Sync Workflow](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=Tips}
På grund av sin natur kan synkrona arbetsflöden inte använda noder som skapar ett "väntande" tillstånd, till exempel "Manuell bearbetning".
:::

## Automatisk radering av historik

När ett arbetsflöde utlöses ofta kan ni konfigurera automatisk radering av historik för att minska röran och avlasta databasens lagringsutrymme.

Ni kan också konfigurera om historiken för ett arbetsflöde ska raderas automatiskt i dess skapande- och redigeringsdialoger:

![Auto-delete Execution History Configuration](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

Automatisk radering kan konfigureras baserat på utföranderesultatets status. I de flesta fall rekommenderas det att endast markera statusen "Slutförd" för att behålla poster över misslyckade utföranden för framtida felsökning.

Det rekommenderas att inte aktivera automatisk radering av historik när ni felsöker ett arbetsflöde, så att ni kan använda historiken för att kontrollera om arbetsflödets utförandelogik är som förväntat.

:::info{title=Tips}
Att radera ett arbetsflödes historik minskar inte antalet gånger arbetsflödet har utförts.
:::