:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

### Nummerformatering

#### 1. :formatN(precision)

##### Syntaxbeskrivning
Formaterar ett nummer enligt lokala inställningar.  
Parameter:
- **precision:** Antal decimaler.  
  För ODS/XLSX-format bestäms antalet visade decimaler av textredigeraren; för andra format används denna parameter.

##### Exempel
```
// Exempelmiljö: API-alternativ { "lang": "en-us" }
'10':formatN()         // Utdata "10.000"
'1000.456':formatN()   // Utdata "1,000.456"
```

##### Resultat
Numret visas enligt den angivna precisionen och det lokala formatet.


#### 2. :round(precision)

##### Syntaxbeskrivning
Avrundar numret till det angivna antalet decimaler.

##### Exempel
```
10.05123:round(2)      // Utdata 10.05
1.05:round(1)          // Utdata 1.1
```

##### Resultat
Resultatet är det avrundade numret.


#### 3. :add(value)

##### Syntaxbeskrivning
Lägger till det angivna värdet till det aktuella numret.  
Parameter:
- **value:** Värdet som ska läggas till.

##### Exempel
```
1000.4:add(2)         // Utdata 1002.4
'1000.4':add('2')      // Utdata 1002.4
```

##### Resultat
Resultatet är summan av numren.


#### 4. :sub(value)

##### Syntaxbeskrivning
Subtraherar det angivna värdet från det aktuella numret.  
Parameter:
- **value:** Värdet som ska subtraheras.

##### Exempel
```
1000.4:sub(2)         // Utdata 998.4
'1000.4':sub('2')      // Utdata 998.4
```

##### Resultat
Resultatet är det aktuella numret minus det angivna värdet.


#### 5. :mul(value)

##### Syntaxbeskrivning
Multiplicerar det aktuella numret med det angivna värdet.  
Parameter:
- **value:** Multiplikatorn.

##### Exempel
```
1000.4:mul(2)         // Utdata 2000.8
'1000.4':mul('2')      // Utdata 2000.8
```

##### Resultat
Resultatet är produkten av numren.


#### 6. :div(value)

##### Syntaxbeskrivning
Dividerar det aktuella numret med det angivna värdet.  
Parameter:
- **value:** Divisorn.

##### Exempel
```
1000.4:div(2)         // Utdata 500.2
'1000.4':div('2')      // Utdata 500.2
```

##### Resultat
Resultatet är kvoten av divisionen.


#### 7. :mod(value)

##### Syntaxbeskrivning
Beräknar modulus (resten) av det aktuella numret dividerat med det angivna värdet.  
Parameter:
- **value:** Modulus-divisorn.

##### Exempel
```
4:mod(2)              // Utdata 0
3:mod(2)              // Utdata 1
```

##### Resultat
Resultatet är resten från modulus-operationen.


#### 8. :abs

##### Syntaxbeskrivning
Returnerar numrets absolutvärde.

##### Exempel
```
-10:abs()             // Utdata 10
-10.54:abs()          // Utdata 10.54
10.54:abs()           // Utdata 10.54
'-200':abs()          // Utdata 200
```

##### Resultat
Resultatet är absolutvärdet.


#### 9. :ceil

##### Syntaxbeskrivning
Avrundar numret uppåt till det minsta heltal som är större än eller lika med det aktuella numret.

##### Exempel
```
10.05123:ceil()       // Utdata 11
1.05:ceil()           // Utdata 2
-1.05:ceil()          // Utdata -1
```

##### Resultat
Resultatet är det uppåtavrundade heltalet.


#### 10. :floor

##### Syntaxbeskrivning
Avrundar numret nedåt till det största heltal som är mindre än eller lika med det aktuella numret.

##### Exempel
```
10.05123:floor()      // Utdata 10
1.05:floor()          // Utdata 1
-1.05:floor()         // Utdata -2
```

##### Resultat
Resultatet är det nedåtavrundade heltalet.


#### 11. :int

##### Syntaxbeskrivning
Konverterar numret till ett heltal (rekommenderas inte).

##### Exempel och resultat
Beror på det specifika konverteringsfallet.


#### 12. :toEN

##### Syntaxbeskrivning
Konverterar numret till engelskt format (med `.` som decimaltecken). Rekommenderas inte.

##### Exempel och resultat
Beror på det specifika konverteringsfallet.


#### 13. :toFixed

##### Syntaxbeskrivning
Konverterar numret till en sträng och behåller endast det angivna antalet decimaler. Rekommenderas inte.

##### Exempel och resultat
Beror på det specifika konverteringsfallet.


#### 14. :toFR

##### Syntaxbeskrivning
Konverterar numret till franskt format (med `,` som decimaltecken). Rekommenderas inte.

##### Exempel och resultat
Beror på det specifika konverteringsfallet.