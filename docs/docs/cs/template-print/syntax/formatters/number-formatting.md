:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/template-print/syntax/formatters/number-formatting).
:::

### Digitální formátování

#### 1. :formatN(precision)

##### Vysvětlení syntaxe
Formátuje číslo podle nastavení lokalizace.  
Parametry:
- precision: počet desetinných míst  
  U formátů ODS/XLSX je počet zobrazených desetinných míst určen textovým editorem; ostatní formáty závisí na tomto parametru.

##### Příklad
```
'10':formatN()         // Výstup "10.000"
'1000.456':formatN()   // Výstup "1,000.456"
```

##### Výsledek
Číslo je vypsáno podle zadané přesnosti a formátu lokalizace.


#### 2. :round(precision)

##### Vysvětlení syntaxe
Zaokrouhlí číslo, parametr určuje počet desetinných míst.

##### Příklad
```
10.05123:round(2)      // Výstup 10.05
1.05:round(1)          // Výstup 1.1
```

##### Výsledek
Výstupem je zaokrouhlená hodnota.


#### 3. :add(value)

##### Vysvětlení syntaxe
Přičte zadanou hodnotu k aktuálnímu číslu.  
Parametry:
- value: sčítanec

##### Příklad
```
1000.4:add(2)         // Výstup 1002.4
'1000.4':add('2')      // Výstup 1002.4
```

##### Výsledek
Výstupem je hodnota po sečtení.


#### 4. :sub(value)

##### Vysvětlení syntaxe
Odečte zadanou hodnotu od aktuálního čísla.  
Parametry:
- value: menšitel

##### Příklad
```
1000.4:sub(2)         // Výstup 998.4
'1000.4':sub('2')      // Výstup 998.4
```

##### Výsledek
Výstupem je hodnota po odečtení.


#### 5. :mul(value)

##### Vysvětlení syntaxe
Vynásobí aktuální číslo zadanou hodnotou.  
Parametry:
- value: činitel

##### Příklad
```
1000.4:mul(2)         // Výstup 2000.8
'1000.4':mul('2')      // Výstup 2000.8
```

##### Výsledek
Výstupem je hodnota po vynásobení.


#### 6. :div(value)

##### Vysvětlení syntaxe
Vydělí aktuální číslo zadanou hodnotou.  
Parametry:
- value: dělitel

##### Příklad
```
1000.4:div(2)         // Výstup 500.2
'1000.4':div('2')      // Výstup 500.2
```

##### Výsledek
Výstupem je hodnota po vydělení.


#### 7. :mod(value)

##### Vysvětlení syntaxe
Vypočítá modulo (zbytek po dělení) aktuálního čísla vůči zadané hodnotě.  
Parametry:
- value: dělitel (pro modulo)

##### Příklad
```
4:mod(2)              // Výstup 0
3:mod(2)              // Výstup 1
```

##### Výsledek
Výstupem je výsledek operace modulo.


#### 8. :abs

##### Vysvětlení syntaxe
Vrátí absolutní hodnotu čísla.

##### Příklad
```
-10:abs()             // Výstup 10
-10.54:abs()          // Výstup 10.54
10.54:abs()           // Výstup 10.54
'-200':abs()          // Výstup 200
```

##### Výsledek
Výstupem je absolutní hodnota.


#### 9. :ceil

##### Vysvětlení syntaxe
Zaokrouhlí nahoru, tedy vrátí nejmenší celé číslo, které je větší nebo rovno aktuálnímu číslu.

##### Příklad
```
10.05123:ceil()       // Výstup 11
1.05:ceil()           // Výstup 2
-1.05:ceil()          // Výstup -1
```

##### Výsledek
Výstupem je zaokrouhlené celé číslo.


#### 10. :floor

##### Vysvětlení syntaxe
Zaokrouhlí dolů, tedy vrátí největší celé číslo, které je menší nebo rovno aktuálnímu číslu.

##### Příklad
```
10.05123:floor()      // Výstup 10
1.05:floor()          // Výstup 1
-1.05:floor()         // Výstup -2
```

##### Výsledek
Výstupem je zaokrouhlené celé číslo.


#### 11. :int

##### Vysvětlení syntaxe
Převede číslo na celé číslo (nedoporučuje se používat).

##### Příklad a výsledek
Závisí na konkrétní situaci převodu.


#### 12. :toEN

##### Vysvětlení syntaxe
Převede číslo do anglického formátu (desetinná tečka je '.'), nedoporučuje se používat.

##### Příklad a výsledek
Závisí na konkrétní situaci převodu.


#### 13. :toFixed

##### Vysvětlení syntaxe
Převede číslo na řetězec, přičemž zachová pouze určený počet desetinných míst, nedoporučuje se používat.

##### Příklad a výsledek
Závisí na konkrétní situaci převodu.


#### 14. :toFR

##### Vysvětlení syntaxe
Převede číslo do francouzského formátu (desetinná čárka je ','), nedoporučuje se používat.

##### Příklad a výsledek
Závisí na konkrétní situaci převodu.