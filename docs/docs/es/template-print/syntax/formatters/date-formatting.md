:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

### Formato de Fechas

#### 1. :formatD(patternOut, patternIn)

##### Explicación de la Sintaxis
Formatea una fecha, aceptando un patrón de formato de salida `patternOut` y un patrón de formato de entrada `patternIn` (que por defecto es ISO 8601).
Puede ajustar la zona horaria y el idioma a través de `options.timezone` y `options.lang`.

##### Ejemplo
```
// Entorno de ejemplo: opciones de la API { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // Salida 01/31/2016
'20160131':formatD(LL)     // Salida January 31, 2016
'20160131':formatD(LLLL)   // Salida Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Salida Sunday

// Ejemplo en francés:
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // Salida mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // Salida dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // Salida dimanche 14 septembre 2014 19:27
```

##### Resultado
La salida es una cadena de fecha con el formato especificado.

#### 2. :addD(amount, unit, patternIn)

##### Explicación de la Sintaxis
Añade una cantidad de tiempo específica a una fecha. Las unidades admitidas incluyen: `day`, `week`, `month`, `quarter`, `year`, `hour`, `minute`, `second`, `millisecond`.
Parámetros:
- `amount`: La cantidad a añadir.
- `unit`: La unidad de tiempo (no distingue entre mayúsculas y minúsculas).
- `patternIn`: Opcional, el formato de entrada (por defecto es ISO8601).

##### Ejemplo
```
// Entorno de ejemplo: opciones de la API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Salida "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Salida "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Salida "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Salida "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Salida "2016-04-30T00:00:00.000Z"
```

##### Resultado
La salida es la nueva fecha después de haber añadido el tiempo especificado.

#### 3. :subD(amount, unit, patternIn)

##### Explicación de la Sintaxis
Resta una cantidad de tiempo específica de una fecha. Los parámetros son los mismos que en `addD`.

##### Ejemplo
```
// Entorno de ejemplo: opciones de la API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Salida "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Salida "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Salida "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Salida "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Salida "2015-10-31T00:00:00.000Z"
```

##### Resultado
La salida es la nueva fecha después de haber restado el tiempo especificado.

#### 4. :startOfD(unit, patternIn)

##### Explicación de la Sintaxis
Establece la fecha al inicio de la unidad de tiempo especificada.
Parámetros:
- `unit`: La unidad de tiempo.
- `patternIn`: Opcional, el formato de entrada.

##### Ejemplo
```
// Entorno de ejemplo: opciones de la API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Salida "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Salida "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Salida "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Salida "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Salida "2016-01-01T00:00:00.000Z"
```

##### Resultado
La salida es la cadena de fecha establecida al inicio de la unidad especificada.

#### 5. :endOfD(unit, patternIn)

##### Explicación de la Sintaxis
Establece la fecha al final de la unidad de tiempo especificada.
Los parámetros son los mismos que para `startOfD`.

##### Ejemplo
```
// Entorno de ejemplo: opciones de la API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Salida "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Salida "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Salida "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Salida "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Salida "2016-01-31T23:59:59.999Z"
```

##### Resultado
La salida es la cadena de fecha establecida al final de la unidad especificada.

#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Explicación de la Sintaxis
Calcula la diferencia entre dos fechas y la devuelve en la unidad especificada. Las unidades de salida admitidas incluyen:
- `day(s)` o `d`
- `week(s)` o `w`
- `quarter(s)` o `Q`
- `month(s)` o `M`
- `year(s)` o `y`
- `hour(s)` o `h`
- `minute(s)` o `m`
- `second(s)` o `s`
- `millisecond(s)` o `ms` (unidad por defecto)

Parámetros:
- `toDate`: La fecha de destino.
- `unit`: La unidad para la salida.
- `patternFromDate`: Opcional, el formato de la fecha de inicio.
- `patternToDate`: Opcional, el formato de la fecha de destino.

##### Ejemplo
```
'20101001':diffD('20101201')              // Salida 5270400000
'20101001':diffD('20101201', 'second')      // Salida 5270400
'20101001':diffD('20101201', 's')           // Salida 5270400
'20101001':diffD('20101201', 'm')           // Salida 87840
'20101001':diffD('20101201', 'h')           // Salida 1464
'20101001':diffD('20101201', 'weeks')       // Salida 8
'20101001':diffD('20101201', 'days')        // Salida 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Salida 5270400000
```

##### Resultado
La salida es la diferencia de tiempo entre las dos fechas, convertida a la unidad especificada.

#### 7. :convDate(patternIn, patternOut)

##### Explicación de la Sintaxis
Convierte una fecha de un formato a otro (no se recomienda su uso).
Parámetros:
- `patternIn`: El formato de fecha de entrada.
- `patternOut`: El formato de fecha de salida.

##### Ejemplo
```
// Entorno de ejemplo: opciones de la API { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // Salida "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Salida "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Salida "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Salida "Sunday"
1410715640:convDate('X', 'LLLL')          // Salida "Sunday, September 14, 2014 7:27 PM"
// Ejemplo en francés:
'20160131':convDate('YYYYMMDD', 'LLLL')   // Salida "dimanche 31 janvier 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // Salida "dimanche"
```

##### Resultado
La salida es la cadena de fecha convertida al formato especificado.

#### 8. Patrones de Formato de Fecha
Símbolos comunes de formato de fecha (consulte la documentación de DayJS):
- `X`: Marca de tiempo Unix (en segundos), por ejemplo, 1360013296
- `x`: Marca de tiempo Unix en milisegundos, por ejemplo, 1360013296123
- `YY`: Año de dos dígitos, por ejemplo, 18
- `YYYY`: Año de cuatro dígitos, por ejemplo, 2018
- `M`, `MM`, `MMM`, `MMMM`: Mes (número, dos dígitos, abreviado, nombre completo)
- `D`, `DD`: Día (número, dos dígitos)
- `d`, `dd`, `ddd`, `dddd`: Día de la semana (número, mínimo, abreviado, nombre completo)
- `H`, `HH`, `h`, `hh`: Hora (formato de 24 horas o 12 horas)
- `m`, `mm`: Minuto
- `s`, `ss`: Segundo
- `SSS`: Milisegundo (3 dígitos)
- `Z`, `ZZ`: Desplazamiento UTC, por ejemplo, +05:00 o +0500
- `A`, `a`: AM/PM
- `Q`: Trimestre (1-4)
- `Do`: Día del mes con ordinal, por ejemplo, 1º, 2º, ...
- Para otros formatos, consulte la documentación completa.
  Además, existen formatos localizados basados en el idioma, como `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, etc.