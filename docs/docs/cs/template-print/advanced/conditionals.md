:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


## Podmíněné příkazy

Podmíněné příkazy Vám umožňují dynamicky řídit zobrazení nebo skrytí obsahu v dokumentu na základě hodnot dat. Existují tři hlavní způsoby zápisu podmínek:

- **Inline podmínky**: Přímo vypíší text (nebo jej nahradí jiným textem).
- **Podmíněné bloky**: Zobrazí nebo skryjí sekci dokumentu, vhodné pro více značek, odstavců, tabulek atd.
- **Chytré podmínky**: Přímo odstraní nebo zachovají cílové prvky (jako řádky, odstavce, obrázky atd.) pomocí jedné značky pro stručnější syntaxi.

Všechny podmínky začínají formátovačem logického vyhodnocení (např. ifEQ, ifGT atd.), po kterém následují formátovače akcí (jako show, elseShow, drop, keep atd.).

### Přehled

Logické operátory a formátovače akcí podporované v podmíněných příkazech zahrnují:

- **Logické operátory**
  - **ifEQ(value)**: Zkontroluje, zda se data rovnají zadané hodnotě.
  - **ifNE(value)**: Zkontroluje, zda se data nerovnají zadané hodnotě.
  - **ifGT(value)**: Zkontroluje, zda jsou data větší než zadaná hodnota.
  - **ifGTE(value)**: Zkontroluje, zda jsou data větší nebo rovna zadané hodnotě.
  - **ifLT(value)**: Zkontroluje, zda jsou data menší než zadaná hodnota.
  - **ifLTE(value)**: Zkontroluje, zda jsou data menší nebo rovna zadané hodnotě.
  - **ifIN(value)**: Zkontroluje, zda jsou data obsažena v poli nebo řetězci.
  - **ifNIN(value)**: Zkontroluje, zda data nejsou obsažena v poli nebo řetězci.
  - **ifEM()**: Zkontroluje, zda jsou data prázdná (např. null, undefined, prázdný řetězec, prázdné pole nebo prázdný objekt).
  - **ifNEM()**: Zkontroluje, zda data nejsou prázdná.
  - **ifTE(type)**: Zkontroluje, zda se datový typ rovná zadanému typu (například "string", "number", "boolean" atd.).
  - **and(value)**: Logické "a", slouží k propojení více podmínek.
  - **or(value)**: Logické "nebo", slouží k propojení více podmínek.

- **Formátovače akcí**
  - **:show(text) / :elseShow(text)**: Používá se v inline podmínkách k přímému výstupu zadaného textu.
  - **:hideBegin / :hideEnd** a **:showBegin / :showEnd**: Používají se v podmíněných blocích k skrytí nebo zobrazení sekcí dokumentu.
  - **:drop(element) / :keep(element)**: Používají se v chytrých podmínkách k odstranění nebo zachování zadaných prvků dokumentu.

Následující sekce představují podrobnou syntaxi, příklady a výsledky pro každé použití.

### Inline podmínky

#### 1. :show(text) / :elseShow(text)

##### Syntax
```
{data:condition:show(text)}
{data:condition:show(text):elseShow(alternative text)}
```

##### Příklad
Předpokládejme, že data jsou:
```json
{
  "val2": 2,
  "val5": 5
}
```
Šablona je následující:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Výsledek
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Switch Case (vícenásobné podmínky)

##### Syntax
Použijte posloupnost formátovačů podmínek k vytvoření struktury podobné switch-case:
```
{data:ifEQ(value1):show(result1):ifEQ(value2):show(result2):elseShow(default result)}
```
Nebo toho dosáhněte pomocí operátoru `or`:
```
{data:ifEQ(value1):show(result1):or(data):ifEQ(value2):show(result2):elseShow(default result)}
```

##### Příklad
Data:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Šablona:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Výsledek
```
val1 = A
val2 = B
val3 = C
```

#### 3. Podmínky s více proměnnými

##### Syntax
Použijte logické operátory `and`/`or` k testování více proměnných:
```
{data1:ifEQ(condition1):and(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
{data1:ifEQ(condition1):or(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
```

##### Příklad
Data:
```json
{
  "val2": 2,
  "val5": 5
}
```
Šablona:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Výsledek
```
and = KO
or = OK
```

### Logické operátory a formátovače

V následujících sekcích popsané formátovače používají syntaxi inline podmínek v následujícím formátu:
```
{data:formatter(parameter):show(text):elseShow(alternative text)}
```

#### 1. :and(value)

##### Syntax
```
{data:ifEQ(value):and(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Příklad
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Výsledek
Pokud se `d.car` rovná `'delorean'` a `d.speed` je větší než 80, výstupem je `TravelInTime`; jinak je výstupem `StayHere`.

#### 2. :or(value)

##### Syntax
```
{data:ifEQ(value):or(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Příklad
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Výsledek
Pokud se `d.car` rovná `'delorean'` nebo `d.speed` je větší než 80, výstupem je `TravelInTime`; jinak je výstupem `StayHere`.

#### 3. :ifEM()

##### Syntax
```
{data:ifEM():show(text):elseShow(alternative text)}
```

##### Příklad
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Výsledek
Pro `null` nebo prázdné pole je výstupem `Result true`; jinak je to `Result false`.

#### 4. :ifNEM()

##### Syntax
```
{data:ifNEM():show(text):elseShow(alternative text)}
```

##### Příklad
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Výsledek
Pro neprázdná data (jako je číslo 0 nebo řetězec 'homer') je výstupem `Result true`; pro prázdná data je výstupem `Result false`.

#### 5. :ifEQ(value)

##### Syntax
```
{data:ifEQ(value):show(text):elseShow(alternative text)}
```

##### Příklad
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Výsledek
Pokud se data rovnají zadané hodnotě, výstupem je `Result true`; jinak je to `Result false`.

#### 6. :ifNE(value)

##### Syntax
```
{data:ifNE(value):show(text):elseShow(alternative text)}
```

##### Příklad
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Výsledek
První příklad vypíše `Result false`, zatímco druhý příklad vypíše `Result true`.

#### 7. :ifGT(value)

##### Syntax
```
{data:ifGT(value):show(text):elseShow(alternative text)}
```

##### Příklad
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Výsledek
První příklad vypíše `Result true` a druhý vypíše `Result false`.

#### 8. :ifGTE(value)

##### Syntax
```
{data:ifGTE(value):show(text):elseShow(alternative text)}
```

##### Příklad
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Výsledek
První příklad vypíše `Result true`, zatímco druhý vypíše `Result false`.

#### 9. :ifLT(value)

##### Syntax
```
{data:ifLT(value):show(text):elseShow(alternative text)}
```

##### Příklad
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Výsledek
První příklad vypíše `Result true` a druhý vypíše `Result false`.

#### 10. :ifLTE(value)

##### Syntax
```
{data:ifLTE(value):show(text):elseShow(alternative text)}
```

##### Příklad
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Výsledek
První příklad vypíše `Result true` a druhý vypíše `Result false`.

#### 11. :ifIN(value)

##### Syntax
```
{data:ifIN(value):show(text):elseShow(alternative text)}
```

##### Příklad
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Výsledek
Oba příklady vypíší `Result true` (protože řetězec obsahuje 'is' a pole obsahuje 2).

#### 12. :ifNIN(value)

##### Syntax
```
{data:ifNIN(value):show(text):elseShow(alternative text)}
```

##### Příklad
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Výsledek
První příklad vypíše `Result false` (protože řetězec obsahuje 'is') a druhý příklad vypíše `Result false` (protože pole obsahuje 2).

#### 13. :ifTE(type)

##### Syntax
```
{data:ifTE('type'):show(text):elseShow(alternative text)}
```

##### Příklad
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Výsledek
První příklad vypíše `Result true` (protože 'homer' je řetězec) a druhý vypíše `Result true` (protože 10.5 je číslo).

### Podmíněné bloky

Podmíněné bloky se používají k zobrazení nebo skrytí sekce dokumentu, obvykle k obklopení více značek nebo celého bloku textu.

#### 1. :showBegin / :showEnd

##### Syntax
```
{data:ifEQ(condition):showBegin}
Document block content
{data:showEnd}
```

##### Příklad
Data:
```json
{
  "toBuy": true
}
```
Šablona:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Výsledek
Když je podmínka splněna, zobrazí se obsah mezi značkami:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### Syntax
```
{data:ifEQ(condition):hideBegin}
Document block content
{data:hideEnd}
```

##### Příklad
Data:
```json
{
  "toBuy": true
}
```
Šablona:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Výsledek
Když je podmínka splněna, obsah mezi značkami se skryje, což vede k výstupu:
```
Banana
Grapes
```