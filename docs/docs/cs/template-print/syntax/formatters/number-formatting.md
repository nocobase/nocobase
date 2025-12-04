:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


### Formátování čísel

#### 1. :formatN(precision)

##### Popis syntaxe
Formátuje číslo podle nastavení lokalizace.
Parametr:
- **precision:** Počet desetinných míst.
  U formátů ODS/XLSX je počet zobrazených desetinných míst určen textovým editorem; u ostatních formátů se používá tento parametr.

##### Příklad
```
// Příklad prostředí: API options { "lang": "en-us" }
'10':formatN()         // Výstup "10.000"
'1000.456':formatN()   // Výstup "1,000.456"
```

##### Výsledek
Číslo je vypsáno podle zadané přesnosti a formátu lokalizace.


#### 2. :round(precision)

##### Popis syntaxe
Zaokrouhlí číslo na zadaný počet desetinných míst.

##### Příklad
```
10.05123:round(2)      // Výstup 10.05
1.05:round(1)          // Výstup 1.1
```

##### Výsledek
Výstupem je číslo zaokrouhlené na danou přesnost.


#### 3. :add(value)

##### Popis syntaxe
Přičte zadanou hodnotu k aktuálnímu číslu.
Parametr:
- **value:** Číslo, které se má přičíst.

##### Příklad
```
1000.4:add(2)         // Výstup 1002.4
'1000.4':add('2')      // Výstup 1002.4
```

##### Výsledek
Výstupem je součet aktuálního čísla a zadané hodnoty.


#### 4. :sub(value)

##### Popis syntaxe
Odečte zadanou hodnotu od aktuálního čísla.
Parametr:
- **value:** Číslo, které se má odečíst.

##### Příklad
```
1000.4:sub(2)         // Výstup 998.4
'1000.4':sub('2')      // Výstup 998.4
```

##### Výsledek
Výstupem je aktuální číslo minus zadaná hodnota.


#### 5. :mul(value)

##### Popis syntaxe
Vynásobí aktuální číslo zadanou hodnotou.
Parametr:
- **value:** Násobitel.

##### Příklad
```
1000.4:mul(2)         // Výstup 2000.8
'1000.4':mul('2')      // Výstup 2000.8
```

##### Výsledek
Výstupem je součin aktuálního čísla a zadané hodnoty.


#### 6. :div(value)

##### Popis syntaxe
Vydělí aktuální číslo zadanou hodnotou.
Parametr:
- **value:** Dělitel.

##### Příklad
```
1000.4:div(2)         // Výstup 500.2
'1000.4':div('2')      // Výstup 500.2
```

##### Výsledek
Výstupem je výsledek dělení.


#### 7. :mod(value)

##### Popis syntaxe
Vypočítá zbytek po dělení (modulo) aktuálního čísla zadanou hodnotou.
Parametr:
- **value:** Dělitel pro modulo operaci.

##### Příklad
```
4:mod(2)              // Výstup 0
3:mod(2)              // Výstup 1
```

##### Výsledek
Výstupem je zbytek z operace modulo.


#### 8. :abs

##### Popis syntaxe
Vrátí absolutní hodnotu čísla.

##### Příklad
```
-10:abs()             // Výstup 10
-10.54:abs()          // Výstup 10.54
10.54:abs()           // Výstup 10.54
'-200':abs()          // Výstup 200
```

##### Výsledek
Výstupem je absolutní hodnota vstupního čísla.


#### 9. :ceil

##### Popis syntaxe
Zaokrouhlí číslo nahoru na nejmenší celé číslo, které je větší nebo rovno aktuálnímu číslu.

##### Příklad
```
10.05123:ceil()       // Výstup 11
1.05:ceil()           // Výstup 2
-1.05:ceil()          // Výstup -1
```

##### Výsledek
Výstupem je číslo zaokrouhlené nahoru na nejbližší celé číslo.


#### 10. :floor

##### Popis syntaxe
Zaokrouhlí číslo dolů na největší celé číslo, které je menší nebo rovno aktuálnímu číslu.

##### Příklad
```
10.05123:floor()      // Výstup 10
1.05:floor()          // Výstup 1
-1.05:floor()         // Výstup -2
```

##### Výsledek
Výstupem je číslo zaokrouhlené dolů na nejbližší celé číslo.


#### 11. :int

##### Popis syntaxe
Převede číslo na celé číslo (nedoporučuje se používat).

##### Příklad a výsledek
Závisí na konkrétním případě převodu.


#### 12. :toEN

##### Popis syntaxe
Převede číslo do anglického formátu (s tečkou '.' jako desetinným oddělovačem). Nedoporučuje se používat.

##### Příklad a výsledek
Závisí na konkrétním případě převodu.


#### 13. :toFixed

##### Popis syntaxe
Převede číslo na řetězec a zachová pouze zadaný počet desetinných míst. Nedoporučuje se používat.

##### Příklad a výsledek
Závisí na konkrétním případě převodu.


#### 14. :toFR

##### Popis syntaxe
Převede číslo do francouzského formátu (s čárkou ',' jako desetinným oddělovačem). Nedoporučuje se používat.

##### Příklad a výsledek
Závisí na konkrétním případě převodu.