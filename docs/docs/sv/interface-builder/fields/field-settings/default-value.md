:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Standardvärde

## Introduktion

Ett standardvärde är det initiala värdet för ett fält när en ny post skapas. Ni kan ange ett standardvärde för ett fält när ni konfigurerar det i en samling, eller specificera ett standardvärde för ett fält i ett block för att lägga till formulär. Det kan ställas in som en konstant eller en variabel.

## Var kan ni ange standardvärden?

### Samlingsfält

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### Fält i ett formulär för att lägga till

De flesta fält i ett formulär för att lägga till stöder inställning av ett standardvärde.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Lägga till i ett underformulär

Underdata som läggs till via ett underformulärsfält, antingen i ett formulär för att lägga till eller redigera, kommer att ha ett standardvärde.

Lägg till nytt i ett underformulär
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

När ni redigerar befintlig data kommer ett tomt fält inte att fyllas med standardvärdet. Endast nyligen tillagd data kommer att fyllas med standardvärdet.

### Standardvärden för relationsfält

Endast relationer av typen **Många-till-en** och **Många-till-många** har standardvärden när ni använder väljarkomponenter (Select, RecordPicker).

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Standardvärdesvariabler

### Vilka variabler finns tillgängliga?

- Aktuell användare;
- Aktuell post; detta gäller endast för befintliga poster;
- Aktuellt formulär, listar idealt sett endast fälten i formuläret;
- Aktuellt objekt, ett koncept inom underformulär (dataobjektet för varje rad i underformuläret);
- URL-parametrar
  För mer information om variabler, se [Variabler](/interface-builder/variables)

### Fältvariabler för standardvärden

Dessa delas in i två kategorier: icke-relationsfält och relationsfält.

#### Relationsfältvariabler för standardvärden

- Variabelobjektet måste vara en samlingspost;
- Det måste vara en samling i arvskedjan, vilket kan vara den aktuella samlingen eller en förälder-/barnsamling;
- Variabeln "Valda poster i tabell" är endast tillgänglig för relationsfält av typen "Många-till-många" och "En-till-många/Många-till-en";
- **För flernivåscenarier måste den plattas ut och dedupliceras**

```typescript
// Valda poster i tabell:
[{id:1},{id:2},{id:3},{id:4}]

// Valda poster i tabell/till-en:
[{toOne: {id:2}}, {toOne: {id:3}}, {toOne: {id:3}}]
// Platta ut och deduplicera
[{id: 2}, {id: 3}]

// Valda poster i tabell/till-många:
[{toMany: [{id: 1}, {id:2}]}, {toMany: {[id:3}, {id:4}]}]
// Platta ut
[{id:1},{id:2},{id:3},{id:4}]
```

#### Icke-relationsfältvariabler för standardvärden

- Typerna måste vara konsekventa eller kompatibla, t.ex. är strängar kompatibla med siffror, och alla objekt som tillhandahåller en toString-metod;
- JSON-fältet är speciellt och kan lagra vilken typ av data som helst;

### Fältnivå (Valfria fält)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

- Icke-relationsfältvariabler för standardvärden
  - När ni väljer fält på flera nivåer är det begränsat till en-till-en-relationer och stöder inte en-till-många-relationer;
  - JSON-fältet är speciellt och kan vara obegränsat;

- Relationsfältvariabler för standardvärden
  - hasOne, stöder endast en-till-en-relationer;
  - hasMany, både en-till-en (intern konvertering) och en-till-många stöds;
  - belongsToMany, både en-till-en (intern konvertering) och en-till-många stöds;
  - belongsTo, är generellt för en-till-en, men när föräldrarelationen är hasMany, stöder den också en-till-många (eftersom hasMany/belongsTo i grunden är en många-till-många-relation);

## Särskilda fall

### "Många-till-många" motsvarar en kombination av "En-till-många/Många-till-en"

Modell

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### Varför har inte en-till-en och en-till-många standardvärden?

Till exempel, i en A.B-relation, om b1 är associerad med a1, kan den inte associeras med a2. Om b1 associeras med a2, kommer dess association med a1 att tas bort. I det här fallet delas inte datan, medan standardvärdet är en delad mekanism (alla kan associeras). Därför kan en-till-en- och en-till-många-relationer inte ha standardvärden.

### Varför kan inte många-till-en och många-till-många underformulär eller undertabeller ha standardvärden?

Eftersom fokus för underformulär och undertabeller är att direkt redigera relationsdata (inklusive att lägga till och ta bort), medan relationsstandardvärdet är en delad mekanism där alla kan associeras, men relationsdata inte kan modifieras. Därför är det inte lämpligt att tillhandahålla standardvärden i detta scenario.

Dessutom har underformulär eller undertabeller underfält, och det skulle vara oklart om standardvärdet för ett underformulär eller en undertabell är ett radstandardvärde eller ett kolumnstandardvärde.

Med hänsyn till alla faktorer är det mer lämpligt att underformulär eller undertabeller inte kan ha standardvärden inställda direkt, oavsett relationstyp.