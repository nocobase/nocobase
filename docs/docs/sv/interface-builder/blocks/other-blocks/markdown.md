:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Markdown-block

## Introduktion

Ett Markdown-block behöver inte kopplas till en datakälla. Ni använder Markdown-syntax för att definiera textinnehållet, vilket gör det möjligt att visa formaterad text.

## Lägg till block

Ni kan lägga till ett Markdown-block på en sida eller i ett popup-fönster.

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

Ni kan också lägga till ett inbäddat (inline-block) Markdown-block i formulärblock och detaljblock.

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Mallmotor

Den använder **[Liquid-mallmotorn](https://liquidjs.com/tags/overview.html)** för att erbjuda kraftfulla och flexibla funktioner för mallrendering, vilket gör att innehåll kan genereras dynamiskt och visas på ett anpassat sätt. Med mallmotorn kan ni:

-   **Dynamisk interpolering**: Använd platshållare i mallen för att referera till variabler, till exempel ersätts `{{ ctx.user.userName }}` automatiskt med motsvarande användarnamn.
-   **Villkorlig rendering**: Stöder villkorssatser (`{% if %}...{% else %}`), vilket visar olika innehåll baserat på olika datastatusar.
-   **Loopning**: Använd `{% for item in list %}...{% endfor %}` för att iterera över arrayer eller samlingar för att generera listor, tabeller eller upprepande moduler.
-   **Inbyggda filter**: Erbjuder en mängd filter (som `upcase`, `downcase`, `date`, `truncate` etc.) för att formatera och bearbeta data.
-   **Utbyggbarhet**: Stöder anpassade variabler och funktioner, vilket gör mallogiken återanvändbar och underhållbar.
-   **Säkerhet och isolering**: Mallrendering utförs i en sandlådemiljö, vilket förhindrar direkt körning av farlig kod och förbättrar säkerheten.

Med Liquid-mallmotorn kan utvecklare och innehållsskapare **enkelt uppnå dynamisk innehållsvisning, personlig dokumentgenerering och mallrendering för komplexa datastrukturer**, vilket avsevärt förbättrar effektiviteten och flexibiliteten.

## Använda variabler

Markdown på en sida stöder vanliga systemvariabler (som aktuell användare, aktuell roll etc.).

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Markdown i ett popup-fönster för blockradsåtgärder (eller undersida) stöder fler datakontextvariabler (som aktuell post, aktuell popup-post etc.).

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

## QR-kod

Ni kan konfigurera QR-koder i Markdown.

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```