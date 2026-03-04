:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/template-print/syntax/formatters/number-formatting) voor nauwkeurige informatie.
:::

### Getalformattering

#### 1. :formatN(precision)

##### Syntaxisuitleg
Formatteert een getal op basis van de lokalisatie-instellingen.  
Parameters:
- precision: het aantal decimalen  
  Voor ODS/XLSX-formaten wordt het aantal weergegeven decimalen bepaald door de teksteditor; voor andere formaten is dit afhankelijk van deze parameter.

##### Voorbeeld
```
'10':formatN()         // Uitvoer "10.000"
'1000.456':formatN()   // Uitvoer "1,000.456"
```

##### Resultaat
Het getal wordt uitgevoerd volgens de opgegeven precisie en lokalisatie-indeling.


#### 2. :round(precision)

##### Syntaxisuitleg
Rondt een getal af, waarbij de parameter het aantal decimalen specificeert.

##### Voorbeeld
```
10.05123:round(2)      // Uitvoer 10.05
1.05:round(1)          // Uitvoer 1.1
```

##### Resultaat
De uitvoer is de afgeronde waarde.


#### 3. :add(value)

##### Syntaxisuitleg
Telt de opgegeven waarde op bij het huidige getal.  
Parameters:
- value: de op te tellen waarde

##### Voorbeeld
```
1000.4:add(2)         // Uitvoer 1002.4
'1000.4':add('2')      // Uitvoer 1002.4
```

##### Resultaat
De uitvoer is de waarde na de optelling.


#### 4. :sub(value)

##### Syntaxisuitleg
Trekt de opgegeven waarde af van het huidige getal.  
Parameters:
- value: de af te trekken waarde

##### Voorbeeld
```
1000.4:sub(2)         // Uitvoer 998.4
'1000.4':sub('2')      // Uitvoer 998.4
```

##### Resultaat
De uitvoer is de waarde na de aftrekking.


#### 5. :mul(value)

##### Syntaxisuitleg
Vermenigvuldigt het huidige getal met de opgegeven waarde.  
Parameters:
- value: de vermenigvuldiger

##### Voorbeeld
```
1000.4:mul(2)         // Uitvoer 2000.8
'1000.4':mul('2')      // Uitvoer 2000.8
```

##### Resultaat
De uitvoer is de waarde na de vermenigvuldiging.


#### 6. :div(value)

##### Syntaxisuitleg
Deelt het huidige getal door de opgegeven waarde.  
Parameters:
- value: de deler

##### Voorbeeld
```
1000.4:div(2)         // Uitvoer 500.2
'1000.4':div('2')      // Uitvoer 500.2
```

##### Resultaat
De uitvoer is de waarde na de deling.


#### 7. :mod(value)

##### Syntaxisuitleg
Berekent de modulus (restwaarde) van het huidige getal ten opzichte van de opgegeven waarde.  
Parameters:
- value: de modulusdeler

##### Voorbeeld
```
4:mod(2)              // Uitvoer 0
3:mod(2)              // Uitvoer 1
```

##### Resultaat
De uitvoer is het resultaat van de modulusbewerking.


#### 8. :abs

##### Syntaxisuitleg
Retourneert de absolute waarde van het getal.

##### Voorbeeld
```
-10:abs()             // Uitvoer 10
-10.54:abs()          // Uitvoer 10.54
10.54:abs()           // Uitvoer 10.54
'-200':abs()          // Uitvoer 200
```

##### Resultaat
De uitvoer is de absolute waarde.


#### 9. :ceil

##### Syntaxisuitleg
Rondt naar boven af, oftewel retourneert het kleinste gehele getal dat groter is dan of gelijk is aan het huidige getal.

##### Voorbeeld
```
10.05123:ceil()       // Uitvoer 11
1.05:ceil()           // Uitvoer 2
-1.05:ceil()          // Uitvoer -1
```

##### Resultaat
De uitvoer is het afgeronde gehele getal.


#### 10. :floor

##### Syntaxisuitleg
Rondt naar beneden af, oftewel retourneert het grootste gehele getal dat kleiner is dan of gelijk is aan het huidige getal.

##### Voorbeeld
```
10.05123:floor()      // Uitvoer 10
1.05:floor()          // Uitvoer 1
-1.05:floor()         // Uitvoer -2
```

##### Resultaat
De uitvoer is het afgeronde gehele getal.


#### 11. :int

##### Syntaxisuitleg
Converteert het getal naar een geheel getal (niet aanbevolen voor gebruik).

##### Voorbeeld en resultaat
Afhankelijk van de specifieke conversie.


#### 12. :toEN

##### Syntaxisuitleg
Converteert het getal naar het Engelse formaat (met '.' als decimaalteken), niet aanbevolen voor gebruik.

##### Voorbeeld en resultaat
Afhankelijk van de specifieke conversie.


#### 13. :toFixed

##### Syntaxisuitleg
Converteert het getal naar een string en behoudt alleen het opgegeven aantal decimalen, niet aanbevolen voor gebruik.

##### Voorbeeld en resultaat
Afhankelijk van de specifieke conversie.


#### 14. :toFR

##### Syntaxisuitleg
Converteert het getal naar het Franse formaat (met ',' als decimaalteken), niet aanbevolen voor gebruik.

##### Voorbeeld en resultaat
Afhankelijk van de specifieke conversie.