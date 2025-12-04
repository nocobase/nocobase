:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Temaredigerare

> Den nuvarande temafunktionen är implementerad baserat på Ant Design 5.x. Vi rekommenderar att ni läser om konceptet [Anpassa tema](https://ant.design/docs/react/customize-theme) innan ni fortsätter med detta dokument.

## Introduktion

Temaredigeraren är en plugin som används för att ändra stilarna för hela frontend-sidan. Den stöder för närvarande redigering av globala [SeedToken](https://ant.design/docs/react/customize-theme#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme#maptoken) och [AliasToken](https://ant.design/docs/react/customize-theme#aliastoken), samt möjligheten att [växla](https://ant.design/docs/react/customize-theme#use-preset-algorithms) till mörkt läge (Dark Mode) och kompakt läge (Compact Mode). I framtiden kan den komma att stödja temaanpassning på [komponentnivå](https://ant.design/docs/react/customize-theme#component-level-customization).

## Användningsinstruktioner

### Aktivera temaredigerarens plugin

Uppdatera först NocoBase till den senaste versionen (v0.11.1 eller högre). Sök sedan efter kortet `Temaredigerare` på sidan för pluginhantering. Klicka på knappen `Aktivera` längst ner till höger på kortet och vänta tills sidan laddas om.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Navigera till temakonfigurationssidan

Efter att ni har aktiverat pluginen klickar ni på inställningsknappen längst ner till vänster på kortet för att komma till temaredigeringssidan. Som standard finns det fyra temaalternativ: `Standardtema`, `Mörkt tema`, `Kompakt tema` och `Kompakt mörkt tema`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Lägga till ett nytt tema

Klicka på knappen `Lägg till nytt tema` och välj `Skapa ett helt nytt tema`. En temaredigerare visas då på höger sida av sidan, där ni kan redigera färger, storlekar, stilar och mer. När ni är klar med redigeringen anger ni ett temaname och klickar på spara för att slutföra skapandet av temat.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Tillämpa ett nytt tema

Flytta muspekaren till sidans övre högra hörn för att se temaväxlaren. Klicka på den för att växla till andra teman, till exempel det nyligen tillagda temat.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Redigera ett befintligt tema

Klicka på knappen `Redigera` längst ner till vänster på kortet. En temaredigerare visas då på höger sida av sidan (liknande när ni lägger till ett nytt tema). När ni är klar med redigeringen klickar ni på spara för att slutföra ändringen av temat.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Ställa in användarvalbara teman

Nyligen tillagda teman är som standard tillgängliga för användare att växla till. Om ni inte vill att användare ska kunna växla till ett visst tema, stänger ni av reglaget `Kan väljas av användare` längst ner till höger på temakortet. Detta förhindrar användare från att växla till det temat.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Ställa in som standardtema

Initialt är standardtemat `Standardtema`. För att ställa in ett specifikt tema som standard, slår ni på reglaget `Standardtema` längst ner till höger på kortet. Detta säkerställer att när användare öppnar sidan för första gången, kommer de att se detta tema. Obs: Standardtemat kan inte tas bort.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Ta bort ett tema

Klicka på knappen `Ta bort` under kortet och bekräfta sedan i den uppdykande dialogrutan för att ta bort temat.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)