---
pkg: "@nocobase/plugin-comments"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Kommentarssamling

## Introduktion

Kommentarssamling är en specialiserad datatabellsmall utformad för att lagra användarkommentarer och feedback. Med kommentarsfunktionen kan ni lägga till kommentarsmöjligheter till vilken datatabell som helst, så att användare kan diskutera, ge feedback eller kommentera specifika poster. Kommentarssamlingen stöder rik textredigering, vilket ger flexibla möjligheter för innehållsskapande.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Funktioner

- **Rik textredigering**: Inkluderar som standard Markdown (vditor)-redigeraren, som stöder skapande av rik text.
- **Koppla till valfri datatabell**: Kan koppla kommentarer till poster i vilken datatabell som helst via relationsfält.
- **Flernivåkommentarer**: Stöder svar på kommentarer och bygger en kommentarträdsstruktur.
- **Användarspårning**: Registrerar automatiskt kommentarskapare och skapandetid.

## Användarhandbok

### Skapa en kommentarssamling

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1.  Gå till sidan för datatabellhantering.
2.  Klicka på knappen ”Skapa samling”.
3.  Välj mallen ”Kommentarssamling”.
4.  Ange tabellnamnet (t.ex. ”Uppgiftskommentarer”, ”Artikelkommentarer” osv.).
5.  Systemet skapar automatiskt en kommentarstabell med följande standardfält:
    -   Kommentarsinnehåll (Markdown vditor-typ)
    -   Skapad av (kopplad till användartabell)
    -   Skapad den (datum/tid-typ)

### Konfigurera relationer

För att koppla kommentarer till en måldatatabell behöver ni konfigurera relationsfält:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1.  Lägg till ett ”Många-till-en”-relationsfält i kommentarstabellen.
2.  Välj den måldatatabell att koppla till (t.ex. uppgiftstabell, artikeltabell osv.).
3.  Ange fältnamnet (t.ex. ”Tillhör uppgift”, ”Tillhör artikel” osv.).

### Använda kommentarsblock på sidor

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1.  Gå till sidan där ni vill lägga till kommentarsfunktionalitet.
2.  Lägg till ett block i detaljerna eller popup-fönstret för den valda posten.
3.  Välj blocktypen ”Kommentarer”.
4.  Välj den kommentarssamling ni just skapade.

### Typiska användningsområden

-   **Uppgiftshanteringssystem**: Teammedlemmar diskuterar och ger feedback på uppgifter.
-   **Innehållshanteringssystem**: Läsare kommenterar och interagerar med artiklar.
-   **Godkännandearbetsflöden**: Godkännare kommenterar och ger synpunkter på ansökningsformulär.
-   **Kundfeedback**: Samla in kundrecensioner av produkter eller tjänster.

## Att tänka på

-   Kommentarssamlingen är en funktion i ett kommersiellt plugin och kräver att kommentarer-pluginet är aktiverat.
-   Det rekommenderas att ni ställer in lämpliga behörigheter för kommentarstabellen för att kontrollera vem som kan visa, skapa och ta bort kommentarer.
-   För scenarier med många kommentarer rekommenderas det att aktivera sidindelning för bättre prestanda.