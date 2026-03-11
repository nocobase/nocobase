:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/fields/specific/sub-table-popup).
:::

# Undertabell (popup-redigering)

## Introduktion

Undertabellen (popup-redigering) används för att hantera data med flera associationer (såsom ett-till-många eller många-till-många) i ett formulär. Tabellen visar endast poster som för närvarande är associerade. Tillägg eller redigering av poster sker i ett popup-fönster, och data sparas i databasen tillsammans när huvudformuläret skickas in.

## Användning

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

**Tillämpliga scenarier:**

- Associationsfält: O2M / M2M / MBM
- Typiska användningsområden: Orderdetaljer, underlistor, associerade taggar/medlemmar, etc.

## Fältkonfiguration

### Tillåt val av befintlig data (Standard: Aktiverad)

Stöder val av associationer från befintliga poster.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Fältkomponent

[Fältkomponent](/interface-builder/fields/association-field): Växla till andra komponenter för relationsfält, såsom rullgardinsmeny, samlingsväljare, etc.

### Tillåt bortkoppling av befintlig data (Standard: Aktiverad)

> Kontrollerar om befintlig associerad data i redigeringsformuläret får kopplas bort. Nyligen tillagd data kan alltid tas bort.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Tillåt tillägg (Standard: Aktiverad)

Kontrollerar om knappen "Lägg till" visas. Om användaren saknar `create`-behörighet för mål-samlingen, kommer knappen att inaktiveras med ett meddelande om saknad behörighet.

### Tillåt snabbredigering (Standard: Inaktiverad)

När detta är aktiverat visas en redigeringsikon när ni håller muspekaren över en cell, vilket möjliggör snabb ändring av cellens innehåll.

Ni kan aktivera snabbredigering för alla fält via inställningarna för associationsfältets komponent.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

Det kan även aktiveras för enskilda kolumnfält.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Sidstorlek (Standard: 10)

Anger antalet poster som visas per sida i undertabellen.

## Beteendebeskrivning

- Vid val av befintliga poster utförs dubblettkontroll baserat på primärnyckeln för att förhindra att samma post associeras flera gånger.
- Nya poster läggs till direkt i undertabellen, och vyn hoppar automatiskt till den sida som innehåller den nya posten.
- Radredigering ändrar endast data för den aktuella raden.
- Borttagning kopplar endast bort associationen i det aktuella formuläret; det raderar inte källdata från databasen.
- Data sparas i databasen först när huvudformuläret skickas in.