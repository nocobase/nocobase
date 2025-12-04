:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Datafråga

Diagrammets konfigurationspanel är uppdelad i tre delar: Datafråga, Diagramalternativ och Interaktionshändelser, samt knapparna Avbryt, Förhandsgranska och Spara längst ner.

Låt oss först titta på panelen "Datafråga" för att förstå de två frågelägena (Builder/SQL) och deras vanliga funktioner.

## Panelstruktur
![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> Tips: För att enklare konfigurera det aktuella innehållet kan ni först fälla ihop andra paneler.

Överst finns åtgärdsfältet:
- Läge: Builder (grafiskt, enkelt och bekvämt) / SQL (manuellt skrivna satser, mer flexibelt).
- Kör fråga: Klicka för att utföra datafrågan.
- Visa resultat: Öppnar panelen för dataresultat, där ni kan växla mellan Tabell-/JSON-vyer. Klicka igen för att fälla ihop panelen.

Uppifrån och ner, i tur och ordning:
- Datakälla och samling: Obligatoriskt. Välj datakälla och samling.
- Mått: Obligatoriskt. De numeriska fält som ska visas.
- Dimensioner: Gruppera efter fält (t.ex. datum, kategori, region).
- Filter: Ställ in filtervillkor (t.ex. =, ≠, >, <, innehåller, intervall). Flera villkor kan kombineras.
- Sortera: Välj fält att sortera efter och ordning (stigande/fallande).
- Sidnumrering: Kontrollera dataomfång och returordning.

## Builder-läge

### Välj datakälla och samling
- I panelen "Datafråga" ställer ni in läget till "Builder".
- Välj en datakälla och samling. Om samlingen inte är valbar eller är tom, kontrollera först behörigheter och om den har skapats.

### Konfigurera Mått
- Välj ett eller flera numeriska fält och ställ in en aggregering: `Sum`, `Count`, `Avg`, `Max`, `Min`.
- Vanliga användningsfall: `Count` för att räkna poster, `Sum` för att beräkna en totalsumma.

### Konfigurera Dimensioner
- Välj ett eller flera fält som grupperingsdimensioner.
- Datum- och tidsfält kan formateras (t.ex. `ÅÅÅÅ-MM`, `ÅÅÅÅ-MM-DD`) för att underlätta gruppering per månad eller dag.

### Filtrera, Sortera och Sidnumrera
- Filter: Lägg till villkor (t.ex. =, ≠, innehåller, intervall). Flera villkor kan kombineras.
- Sortera: Välj ett fält och sorteringsordningen (stigande/fallande).
- Sidnumrering: Ställ in `Limit` och `Offset` för att kontrollera antalet returnerade rader. Det rekommenderas att ställa in en liten `Limit` vid felsökning.

### Kör fråga och visa resultat
- Klicka på "Kör fråga" för att utföra. När den har returnerats, växla mellan `Tabell / JSON` i "Visa resultat" för att kontrollera kolumner och värden.
- Innan ni mappar diagramfält, bekräfta kolumnnamnen och typerna här för att undvika ett tomt diagram eller fel senare.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Efterföljande fältmappning

Senare, när ni konfigurerar "Diagramalternativ", kommer ni att mappa fält baserat på fälten från den valda datakällan och samlingen.

## SQL-läge

### Skriv fråga
- Växla till "SQL"-läge, skriv in er frågesats och klicka på "Kör fråga".
- Exempel (total orderbelopp per datum):
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Kör fråga och visa resultat

- Klicka på "Kör fråga" för att utföra. När den har returnerats, växla mellan `Tabell / JSON` i "Visa resultat" för att kontrollera kolumner och värden.
- Innan ni mappar diagramfält, bekräfta kolumnnamnen och typerna här för att undvika ett tomt diagram eller fel senare.

### Efterföljande fältmappning

Senare, när ni konfigurerar "Diagramalternativ", kommer ni att mappa fält baserat på kolumnerna från frågeresultatet.

> [!TIP]
> För mer information om SQL-läge, se Avancerad användning — Fråga data i SQL-läge.