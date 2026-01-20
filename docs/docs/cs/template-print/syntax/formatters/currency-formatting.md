:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


### Formátování měny

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Vysvětlení syntaxe
Formátuje číselnou hodnotu měny a umožňuje zadat počet desetinných míst nebo konkrétní výstupní formát.  
Parametry:
- **precisionOrFormat:** Volitelný parametr, který může být buď číslo (určující počet desetinných míst), nebo specifikátor formátu:
  - Celé číslo: změní výchozí přesnost desetinných míst.
  - `'M'`: Vypíše pouze hlavní název měny.
  - `'L'`: Vypíše číslo spolu se symbolem měny (výchozí).
  - `'LL'`: Vypíše číslo spolu s hlavním názvem měny.
- **targetCurrency:** Volitelný; kód cílové měny (velkými písmeny, např. USD, EUR), který přepíše globální nastavení.

##### Příklad
```
// Příklad prostředí: Možnosti API { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Vypíše "$2,000.91"
'1000.456':formatC('M')    // Vypíše "dollars"
'1':formatC('M')           // Vypíše "dollar"
'1000':formatC('L')        // Vypíše "$2,000.00"
'1000':formatC('LL')       // Vypíše "2,000.00 dollars"

// Příklad ve francouzštině (při odlišném nastavení prostředí):
'1000.456':formatC()      // Vypíše "2 000,91 ..."  
'1000.456':formatC()      // Když jsou zdrojová a cílová měna stejné, vypíše "1 000,46 €"
```

##### Výsledek
Výsledek výstupu závisí na možnostech API a nastavení směnných kurzů.


#### 2. :convCurr(target, source)

##### Vysvětlení syntaxe
Převede číslo z jedné měny na druhou. Směnný kurz lze předat prostřednictvím možností API nebo nastavit globálně.  
Pokud nejsou zadány žádné parametry, převod se automaticky provede z `options.currencySource` na `options.currencyTarget`.  
Parametry:
- **target:** Volitelný; kód cílové měny (výchozí hodnota je `options.currencyTarget`).
- **source:** Volitelný; kód zdrojové měny (výchozí hodnota je `options.currencySource`).

##### Příklad
```
// Příklad prostředí: Možnosti API { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Vypíše 20
1000:convCurr()            // Vypíše 2000
1000:convCurr('EUR')        // Vypíše 1000
1000:convCurr('USD')        // Vypíše 2000
1000:convCurr('USD', 'USD') // Vypíše 1000
```

##### Výsledek
Výstupem je převedená číselná hodnota měny.