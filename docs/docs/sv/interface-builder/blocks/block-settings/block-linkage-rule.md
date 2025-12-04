:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Blockkopplingsregler

## Introduktion

Blockkopplingsregler låter användare dynamiskt styra visningen av block och hantera presentationen av element på blocknivå. Eftersom block fungerar som behållare för fält och åtgärdsknappar, kan ni med dessa regler flexibelt styra visningen av hela vyn utifrån blockets dimension.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Obs!**: Innan blockkopplingsregler körs måste blockets visning först genomgå en **ACL-behörighetskontroll**. Endast när en användare har motsvarande åtkomstbehörigheter kommer logiken för blockkopplingsreglerna att utvärderas. Med andra ord träder blockkopplingsregler i kraft först efter att kraven för ACL-visningsbehörighet är uppfyllda. Om det inte finns några blockkopplingsregler visas blocket som standard.

### Styra block med globala variabler

**Blockkopplingsregler** stöder användningen av globala variabler för att dynamiskt styra innehållet som visas i block. Detta gör att användare med olika roller och behörigheter kan se och interagera med anpassade datavyer. Till exempel, i ett orderhanteringssystem, även om olika roller (som administratörer, säljare och ekonomipersonal) alla har behörighet att se ordrar, kan fälten och åtgärdsknapparna som varje roll behöver se skilja sig åt. Genom att konfigurera globala variabler kan ni flexibelt justera de visade fälten, åtgärdsknapparna och till och med sorterings- och filtreringsreglerna för data, baserat på användarens roll, behörigheter eller andra villkor.

#### Specifika användningsfall:

-   **Roll- och behörighetskontroll**: Styr synligheten eller redigerbarheten för vissa fält baserat på olika rollbehörigheter. Till exempel kan säljare endast se grundläggande orderinformation, medan ekonomipersonal kan se betalningsdetaljer.
-   **Personliga vyer**: Anpassa olika blockvyer för olika avdelningar eller team, för att säkerställa att varje användare endast ser innehåll som är relevant för deras arbete, vilket förbättrar effektiviteten.
-   **Hantering av åtgärdsbehörigheter**: Styr visningen av åtgärdsknappar med hjälp av globala variabler. Till exempel kan vissa roller endast se data, medan andra kan utföra åtgärder som att ändra eller radera.

### Styra block med kontextuella variabler

Block kan också styras av variabler i kontexten. Till exempel kan ni använda kontextuella variabler som "Aktuell post", "Aktuellt formulär" och "Aktuell popup-post" för att dynamiskt visa eller dölja block.

Exempel: Blocket "Order Opportunity Information" visas endast när orderstatusen är "Betald".

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

För mer information om kopplingsregler, se [Kopplingsregler](/interface-builder/linkage-rule).