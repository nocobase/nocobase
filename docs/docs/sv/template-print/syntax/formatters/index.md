:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

## Formatters

Formaterare används för att omvandla rådata till lättläst text. De tillämpas på data med ett kolon (':') och kan kedjas, så att utdata från en formaterare blir indata för nästa. Vissa formaterare stöder konstanta parametrar eller dynamiska parametrar.

### Översikt

#### 1. Syntaxförklaring
Den grundläggande syntaxen för att anropa en formaterare är följande:
```
{d.egenskap:formatter1:formatter2(...)}
```  
Till exempel, för att omvandla strängen `"JOHN"` till `"John"`, används först formateraren `lowerCase` för att konvertera alla bokstäver till gemener, och sedan `ucFirst` för att göra den första bokstaven till en versal.

#### 2. Exempel
Data:
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Mall:
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Resultat
Efter rendering blir utdata:
```
My name is John. I was born on January 31, 2000.
```

### Konstanta parametrar

#### 1. Syntaxförklaring
Många formaterare stöder en eller flera konstanta parametrar, som separeras med kommatecken och omsluts av parenteser för att modifiera utdata. Till exempel lägger `:prepend(myPrefix)` till "myPrefix" framför texten.  
**Observera:** Om parametern innehåller kommatecken eller mellanslag måste den omslutas av enkla citattecken, till exempel: `prepend('my prefix')`.

#### 2. Exempel
Mallexempel (se den specifika formaterarens användning för detaljer).

#### 3. Resultat
Utdata kommer att ha det angivna prefixet tillagt framför texten.

### Dynamiska parametrar

#### 1. Syntaxförklaring
Formaterare stöder även dynamiska parametrar. Dessa parametrar börjar med en punkt ('.') och omsluts inte av citattecken.  
Det finns två sätt att ange dynamiska parametrar:
- **Absolut JSON-sökväg:** Börjar med `d.` eller `c.` (hänvisar till rotdata eller kompletterande data).
- **Relativ JSON-sökväg:** Börjar med en enkel punkt ('.'), vilket indikerar att egenskapen söks från det aktuella överordnade objektet.

Till exempel:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
Det kan också skrivas som en relativ sökväg:
```
{d.subObject.qtyB:add(.qtyC)}
```
Om ni behöver komma åt data från en högre nivå (överordnad eller högre upp), kan ni använda flera punkter:
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. Exempel
Data:
```json
{
  "id": 10,
  "qtyA": 20,
  "subObject": {
    "qtyB": 5,
    "qtyC": 3
  },
  "subArray": [{
    "id": 1000,
    "qtyE": 3
  }]
}
```
Användning i mall:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Resultat: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Resultat: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Resultat: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Resultat: 6 (3 + 3)
```

#### 3. Resultat
Exemplen ger 8, 8, 28 respektive 6.

> **Observera:** Det är inte tillåtet att använda anpassade iteratorer eller arrayfilter som dynamiska parametrar, till exempel:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```