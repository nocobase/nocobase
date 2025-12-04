:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Fråga data i SQL-läge

I panelen "Datafråga" kan ni växla till SQL-läge, skriva och köra en fråga, och sedan direkt använda det returnerade resultatet för att mappa och rendera diagram.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## Skriv SQL-satser
- Välj "SQL"-läge i panelen "Datafråga".
- Skriv in SQL och klicka på "Kör fråga" för att köra den.
- Stöder komplexa SQL-satser, inklusive JOIN över flera tabeller och VIEWs.

Exempel: Orderbelopp per månad
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## Visa resultat
- Klicka på "Visa data" för att öppna förhandsgranskningspanelen för dataresultatet.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

Data stöder paginering; ni kan också växla mellan "Tabell" och "JSON" för att kontrollera kolumnnamn och typer.
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Fältmappning
- I "Diagramalternativ" konfigurerar ni mappningen baserat på kolumnerna i frågeresultatet.
- Som standard används den första kolumnen automatiskt som dimension (X-axel eller kategori), och den andra kolumnen som mått (Y-axel eller värde). Var därför uppmärksam på kolumnordningen i er SQL-fråga:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- Dimensionsfält i första kolumnen
  SUM(total_amount) AS total -- Måttfält därefter
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Använd kontextvariabler
Klicka på x-knappen uppe till höger i SQL-redigeraren för att välja kontextvariabler.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Efter att ni har bekräftat infogas variabeluttrycket vid markörens position (eller ersätter den markerade texten) i SQL-texten.

Till exempel `{{ ctx.user.createdAt }}`. Se till att inte lägga till extra citattecken själv.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Fler exempel
För fler användningsexempel kan ni titta på NocoBase [Demo-applikationen](https://demo3.sg.nocobase.com/admin/5xrop8s0bui).

**Rekommendationer:**
- Stabilisera kolumnnamnen innan ni mappar dem till diagram för att undvika fel senare.
- Under felsökning, ställ in `LIMIT` för att minska antalet returnerade rader och snabba upp förhandsgranskningen.

## Förhandsgranska, spara och återställ
- Klicka på "Kör fråga" för att begära data och uppdatera diagramförhandsgranskningen.
- Klicka på "Spara" för att spara den aktuella SQL-texten och relaterade konfigurationer i databasen.
- Klicka på "Avbryt" för att återgå till det senast sparade tillståndet och kassera aktuella osparade ändringar.