---
pkg: "@nocobase/plugin-ai"
deprecated: true
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Avancerat

## Introduktion

I AI-medarbetar-pluginet kan ni konfigurera datakällor och förinställa vissa samlingsfrågor. Dessa skickas sedan som applikationskontext när ni samtalar med AI-medarbetaren, som då svarar baserat på resultaten från samlingsfrågorna.

## Konfiguration av datakälla

Gå till AI-medarbetar-pluginets konfigurationssida och klicka på fliken `Data source` för att komma till AI-medarbetarens datakällshanteringssida.

![20251022103526](https://static-docs.nocobase.com/20251022103526.png)

Klicka på knappen `Add data source` för att komma till sidan för att skapa datakälla.

Steg 1: Ange grundläggande information för `Collection`:
- I inmatningsfältet `Title` anger ni ett lättigenkännligt namn för datakällan;
- I inmatningsfältet `Collection` väljer ni den datakälla och samling som ska användas;
- I inmatningsfältet `Description` anger ni en beskrivning av datakällan.
- I inmatningsfältet `Limit` anger ni frågegränsen för datakällan för att undvika att för mycket data returneras, vilket skulle överskrida AI-konversationskontexten.

![20251022103935](https://static-docs.nocobase.com/20251022103935.png)

Steg 2: Välj de fält ni vill fråga efter:

I listan `Fields` markerar ni de fält ni vill fråga efter.

![20251022104516](https://static-docs.nocobase.com/20251022104516.png)

Steg 3: Ställ in frågevillkor:

![20251022104635](https://static-docs.nocobase.com/20251022104635.png)

Steg 4: Ställ in sorteringsvillkor:

![20251022104722](https://static-docs.nocobase.com/20251022104722.png)

Slutligen, innan ni sparar datakällan, kan ni förhandsgranska datakällans frågeresultat.

![20251022105012](https://static-docs.nocobase.com/20251022105012.png)

## Skicka datakällor i konversationer

I AI-medarbetarens dialogruta klickar ni på knappen `Add work context` i det nedre vänstra hörnet, väljer `Data source`, och då ser ni den datakälla ni just lade till.

![20251022105240](https://static-docs.nocobase.com/20251022105240.png)

Markera den datakälla ni vill skicka, så bifogas den valda datakällan i dialogrutan.

![20251022105401](https://static-docs.nocobase.com/20251022105401.png)

Efter att ni har skrivit in er fråga, klickar ni på skicka-knappen precis som när ni skickar ett vanligt meddelande, så kommer AI-medarbetaren att svara baserat på datakällan.

Datakällan kommer också att visas i meddelandelistan.

![20251022105611](https://static-docs.nocobase.com/20251022105611.png)

## Att tänka på

Datakällan filtrerar automatiskt data baserat på den aktuella användarens ACL-behörigheter, och visar endast den data som användaren har åtkomst till.