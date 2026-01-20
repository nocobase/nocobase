:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


## Formátovače

Formátovače slouží k převodu nezpracovaných dat do snadno čitelného textu. Aplikují se na data pomocí dvojtečky (`:`) a lze je řetězit, takže výstup jednoho formátovače se stane vstupem pro další. Některé formátovače podporují konstantní nebo dynamické parametry.

### Přehled

#### 1. Vysvětlení syntaxe
Základní volání formátovače vypadá takto:
```
{d.property:formatter1:formatter2(...)}
```  
Například při převodu řetězce `"JOHN"` na `"John"` se nejprve použije formátovač `lowerCase` pro převedení všech písmen na malá, a poté `ucFirst` pro kapitalizaci prvního písmene.

#### 2. Příklad
Data:
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Šablona:
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Výsledek
Po vykreslení je výstup následující:
```
My name is John. I was born on January 31, 2000.
```

### Konstantní parametry

#### 1. Vysvětlení syntaxe
Mnoho formátovačů podporuje jeden nebo více konstantních parametrů, které jsou odděleny čárkami a uzavřeny v závorkách, aby modifikovaly výstup. Například `:prepend(myPrefix)` přidá „myPrefix“ před text.  
**Poznámka:** Pokud parametr obsahuje čárky nebo mezery, musí být uzavřen v jednoduchých uvozovkách, například: `prepend('my prefix')`.

#### 2. Příklad
Příklad šablony (podrobnosti naleznete v popisu konkrétního formátovače).

#### 3. Výsledek
Výstup bude mít před textem přidanou specifikovanou předponu.

### Dynamické parametry

#### 1. Vysvětlení syntaxe
Formátovače podporují také dynamické parametry. Tyto parametry začínají tečkou (`.`) a nejsou uzavřeny v uvozovkách.  
Dynamické parametry lze specifikovat dvěma způsoby:
- **Absolutní JSON cesta:** Začíná `d.` nebo `c.` (odkazuje na kořenová data nebo doplňková data).
- **Relativní JSON cesta:** Začíná jednou tečkou (`.`), což znamená, že vlastnost je hledána v aktuálním nadřazeném objektu.

Například:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
Lze to také zapsat jako relativní cestu:
```
{d.subObject.qtyB:add(.qtyC)}
```
Pokud potřebujete přistupovat k datům z vyšší úrovně (nadřazeného objektu nebo výše), můžete použít více teček:
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. Příklad
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
Použití v šabloně:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Výsledek: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Výsledek: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Výsledek: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Výsledek: 6 (3 + 3)
```

#### 3. Výsledek
Jednotlivé příklady dávají výsledky 8, 8, 28 a 6.

> **Poznámka:** Použití vlastních iterátorů nebo filtrů polí jako dynamických parametrů není povoleno, například:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```