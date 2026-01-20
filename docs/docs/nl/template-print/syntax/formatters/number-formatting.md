:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

### Getalnotatie

#### 1. `:formatN(precision)`

##### Syntaxis
Formatteert een getal volgens de lokalisatie-instellingen.
Parameter:
- `precision`: Het aantal decimalen.
  Voor ODS/XLSX-formaten wordt het aantal weergegeven decimalen bepaald door de teksteditor; voor andere formaten wordt deze parameter gebruikt.

##### Voorbeeld
```
// Voorbeeldomgeving: API-opties { "lang": "en-us" }
'10':formatN()         // Uitvoer "10.000"
'1000.456':formatN()   // Uitvoer "1,000.456"
```

##### Resultaat
Het getal wordt uitgevoerd volgens de opgegeven precisie en lokalisatie-indeling.

#### 2. `:round(precision)`

##### Syntaxis
Rondt het getal af op het opgegeven aantal decimalen.

##### Voorbeeld
```
10.05123:round(2)      // Uitvoer 10.05
1.05:round(1)          // Uitvoer 1.1
```

##### Resultaat
De uitvoer is het afgeronde getal.

#### 3. `:add(value)`

##### Syntaxis
Telt de opgegeven waarde op bij het huidige getal.
Parameter:
- `value`: Het getal dat moet worden opgeteld.

##### Voorbeeld
```
1000.4:add(2)         // Uitvoer 1002.4
'1000.4':add('2')      // Uitvoer 1002.4
```

##### Resultaat
De uitvoer is de som van het huidige getal en de opgegeven waarde.

#### 4. `:sub(value)`

##### Syntaxis
Trekt de opgegeven waarde af van het huidige getal.
Parameter:
- `value`: Het getal dat moet worden afgetrokken.

##### Voorbeeld
```
1000.4:sub(2)         // Uitvoer 998.4
'1000.4':sub('2')      // Uitvoer 998.4
```

##### Resultaat
De uitvoer is het huidige getal min de opgegeven waarde.

#### 5. `:mul(value)`

##### Syntaxis
Vermenigvuldigt het huidige getal met de opgegeven waarde.
Parameter:
- `value`: De vermenigvuldiger.

##### Voorbeeld
```
1000.4:mul(2)         // Uitvoer 2000.8
'1000.4':mul('2')      // Uitvoer 2000.8
```

##### Resultaat
De uitvoer is het product van het huidige getal en de opgegeven waarde.

#### 6. `:div(value)`

##### Syntaxis
Deelt het huidige getal door de opgegeven waarde.
Parameter:
- `value`: De deler.

##### Voorbeeld
```
1000.4:div(2)         // Uitvoer 500.2
'1000.4':div('2')      // Uitvoer 500.2
```

##### Resultaat
De uitvoer is het resultaat van de deling.

#### 7. `:mod(value)`

##### Syntaxis
Berekent de modulus (rest) van het huidige getal gedeeld door de opgegeven waarde.
Parameter:
- `value`: De modulusdeler.

##### Voorbeeld
```
4:mod(2)              // Uitvoer 0
3:mod(2)              // Uitvoer 1
```

##### Resultaat
De uitvoer is de rest van de modulusbewerking.

#### 8. `:abs`

##### Syntaxis
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

#### 9. `:ceil`

##### Syntaxis
Rondt het getal naar boven af naar het kleinste gehele getal dat groter is dan of gelijk is aan het huidige getal.

##### Voorbeeld
```
10.05123:ceil()       // Uitvoer 11
1.05:ceil()           // Uitvoer 2
-1.05:ceil()          // Uitvoer -1
```

##### Resultaat
De uitvoer is het naar boven afgeronde gehele getal.

#### 10. `:floor`

##### Syntaxis
Rondt het getal naar beneden af naar het grootste gehele getal dat kleiner is dan of gelijk is aan het huidige getal.

##### Voorbeeld
```
10.05123:floor()      // Uitvoer 10
1.05:floor()          // Uitvoer 1
-1.05:floor()         // Uitvoer -2
```

##### Resultaat
De uitvoer is het naar beneden afgeronde gehele getal.

#### 11. `:int`

##### Syntaxis
Converteert het getal naar een geheel getal (niet aanbevolen voor gebruik).

##### Voorbeeld en Resultaat
Afhankelijk van de specifieke conversie.

#### 12. `:toEN`

##### Syntaxis
Converteert het getal naar Engelse notatie (met `.` als decimaalteken). Niet aanbevolen voor gebruik.

##### Voorbeeld en Resultaat
Afhankelijk van de specifieke conversie.

#### 13. `:toFixed`

##### Syntaxis
Converteert het getal naar een string, waarbij alleen het opgegeven aantal decimalen behouden blijft. Niet aanbevolen voor gebruik.

##### Voorbeeld en Resultaat
Afhankelijk van de specifieke conversie.

#### 14. `:toFR`

##### Syntaxis
Converteert het getal naar Franse notatie (met `,` als decimaalscheidingsteken). Niet aanbevolen voor gebruik.

##### Voorbeeld en Resultaat
Afhankelijk van de specifieke conversie.