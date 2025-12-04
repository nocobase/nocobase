:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Åtgärdsbehörigheter

## Introduktion

I NocoBase 2.0 styrs åtgärdsbehörigheter för närvarande främst av resursbehörigheter för samlingar:

- **Resursbehörighet för samling**: Används för att enhetligt kontrollera grundläggande åtgärdsbehörigheter för olika roller för en samling, såsom Skapa (Create), Visa (View), Uppdatera (Update) och Ta bort (Delete). Denna behörighet gäller för hela samlingen under datakällan och säkerställer att en rolls motsvarande åtgärdsbehörigheter för den samlingen förblir konsekventa över olika sidor, popup-fönster och block.

### Resursbehörighet för samling

I NocoBase behörighetssystem är åtgärdsbehörigheter för samlingar i princip uppdelade efter CRUD-dimensioner för att säkerställa konsekvens och standardisering i behörighetshanteringen. Till exempel:

- **Skapa-behörighet (Create)**: Styr alla skapa-relaterade åtgärder för samlingen, inklusive lägg till-åtgärder, duplicera-åtgärder med mera. Så länge en roll har skapa-behörighet för denna samling, kommer dess lägg till-, duplicera- och andra skapa-relaterade åtgärder att vara synliga på alla sidor och i alla popup-fönster.
- **Ta bort-behörighet (Delete)**: Styr ta bort-åtgärden för denna samling. Behörigheten förblir konsekvent, oavsett om det är en massborttagningsåtgärd i ett tabellblock eller en borttagningsåtgärd för en enskild post i ett detaljblock.
- **Uppdatera-behörighet (Update)**: Styr uppdateringsrelaterade åtgärder för denna samling, såsom redigera-åtgärder och uppdatera post-åtgärder.
- **Visa-behörighet (View)**: Styr datavisibiliteten för denna samling. Relaterade datablock (tabell, lista, detaljer med mera) är endast synliga när rollen har visa-behörighet för denna samling.

Denna universella metod för behörighetshantering är lämplig för standardiserad databehörighetskontroll, vilket säkerställer att för `samma samling` har `samma åtgärd` `konsekventa` behörighetsregler över `olika sidor, popup-fönster och block`, vilket ger enhetlighet och underhållbarhet.

#### Globala behörigheter

Globala åtgärdsbehörigheter gäller för alla samlingar under datakällan och kategoriseras efter resurstyp enligt följande:

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Specifika åtgärdsbehörigheter för samlingar

Specifika åtgärdsbehörigheter för samlingar åsidosätter datakällans allmänna behörigheter, vilket ytterligare förfinar åtgärdsbehörigheterna och möjliggör anpassade behörighetskonfigurationer för åtkomst till resurser i en specifik samling. Dessa behörigheter är uppdelade i två aspekter:

1. Åtgärdsbehörigheter: Åtgärdsbehörigheter inkluderar åtgärder för att lägga till, visa, redigera, ta bort, exportera och importera. Dessa behörigheter konfigureras baserat på dataskopets dimension:

   - Alla poster: Tillåter användare att utföra åtgärder på alla poster i samlingen.
   - Egna poster: Begränsar användare till att endast utföra åtgärder på de dataposter de själva har skapat.

2. Fältbehörigheter: Fältbehörigheter möjliggör konfiguration av behörigheter för varje fält i olika åtgärder. Till exempel kan vissa fält konfigureras för att endast vara synliga och inte redigerbara.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

## Relaterad dokumentation

[Konfigurera behörigheter]