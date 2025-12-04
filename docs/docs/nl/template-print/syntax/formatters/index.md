:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

## Formatters

Formatters worden gebruikt om ruwe data om te zetten in gemakkelijk leesbare tekst. U past ze toe op data met behulp van een dubbele punt (`:`). Ze kunnen aan elkaar gekoppeld worden, waarbij de uitvoer van de ene formatter de invoer wordt voor de volgende. Sommige formatters ondersteunen constante of dynamische parameters.

### Overzicht

#### 1. Syntaxis
De basisaanroep van een formatter ziet er als volgt uit:
```
{d.eigenschap:formatter1:formatter2(...)}
```  
Stel, u wilt de string `"JOHN"` omzetten naar `"John"`. Dan gebruikt u eerst de `lowerCase` formatter om alle letters naar kleine letters om te zetten, en vervolgens `ucFirst` om de eerste letter een hoofdletter te maken.

#### 2. Voorbeeld
Data:
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Template:
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Resultaat
Na het renderen is de uitvoer:
```
My name is John. I was born on January 31, 2000.
```

### Constante parameters

#### 1. Syntaxis
Veel formatters ondersteunen een of meer constante parameters. Deze worden gescheiden door komma's en tussen haakjes geplaatst om de uitvoer aan te passen. Bijvoorbeeld, `:prepend(myPrefix)` voegt "myPrefix" toe vóór de tekst.  
**Let op:** Als de parameter komma's of spaties bevat, moet deze tussen enkele aanhalingstekens staan, bijvoorbeeld: `prepend('my prefix')`.

#### 2. Voorbeeld
Voorbeeld in template (zie de specifieke formatter-documentatie voor details).

#### 3. Resultaat
De uitvoer zal de opgegeven prefix vóór de tekst bevatten.

### Dynamische parameters

#### 1. Syntaxis
Formatters ondersteunen ook dynamische parameters. Deze parameters beginnen met een punt (`.`) en staan niet tussen aanhalingstekens.  
U kunt dynamische parameters op twee manieren specificeren:
- **Absoluut JSON-pad:** Begint met `d.` of `c.` (verwijzend naar rootdata of aanvullende data).
- **Relatief JSON-pad:** Begint met een enkele punt (`.`), wat aangeeft dat de eigenschap wordt opgezocht binnen het huidige bovenliggende object.

Bijvoorbeeld:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
Dit kan ook als een relatief pad worden geschreven:
```
{d.subObject.qtyB:add(.qtyC)}
```
Als u data van een hoger niveau (bovenliggend of daarboven) wilt benaderen, kunt u meerdere punten gebruiken:
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. Voorbeeld
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
Gebruik in template:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Resultaat: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Resultaat: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Resultaat: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Resultaat: 6 (3 + 3)
```

#### 3. Resultaat
De voorbeelden leveren respectievelijk 8, 8, 28 en 6 op.

> **Let op:** Het is niet toegestaan om aangepaste iterators of array-filters als dynamische parameters te gebruiken, bijvoorbeeld:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```