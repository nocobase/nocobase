:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/template-print/syntax/formatters/date-formatting).
:::

### Formateo de fechas

#### 1. :formatD(patternOut, patternIn)

##### Explicación de la sintaxis
Formatea una fecha, acepta el patrón de formato de salida `patternOut` y el patrón de formato de entrada `patternIn` (por defecto es ISO 8601).

##### Ejemplos comunes
```
{d.createdAt:formatD(YYYY-MM-DD)}           // Salida 2024-01-15
{d.createdAt:formatD(YYYY年M月D日)}          // Salida 2024年1月15日
{d.updatedAt:formatD(YYYY年M月D日 HH:mm)}    // Salida 2024年1月15日 14:30
{d.orderDate:formatD(YYYY/MM/DD HH:mm:ss)}  // Salida 2024/01/15 14:30:25
{d.birthday:formatD(M月D日)}                 // Salida 1月15日
{d.meetingTime:formatD(HH:mm)}              // Salida 14:30
{d.deadline:formatD(YYYY年M月D日 dddd)}      // Salida 2024年1月15日 星期一
```

##### Más ejemplos de formato
```
'20160131':formatD(L)      // Salida 01/31/2016
'20160131':formatD(LL)     // Salida January 31, 2016
'20160131':formatD(LLLL)   // Salida Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Salida Sunday
```

##### Resultado
La salida es una cadena de fecha con el formato especificado.


#### 2. :addD(amount, unit, patternIn)

##### Explicación de la sintaxis
Añade la cantidad de tiempo especificada a la fecha. Unidades admitidas: day, week, month, quarter, year, hour, minute, second, millisecond.  
Parámetros:
- amount: La cantidad a añadir
- unit: Unidad de tiempo (no distingue entre mayúsculas y minúsculas)
- patternIn: Opcional, formato de entrada, por defecto ISO8601

##### Ejemplo
```
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Salida "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Salida "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Salida "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Salida "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Salida "2016-04-30T00:00:00.000Z"
```

##### Resultado
La salida es la nueva fecha después de añadir el tiempo.


#### 3. :subD(amount, unit, patternIn)

##### Explicación de la sintaxis
Resta la cantidad de tiempo especificada de la fecha. Parámetros iguales a `addD`.

##### Ejemplo
```
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Salida "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Salida "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Salida "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Salida "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Salida "2015-10-31T00:00:00.000Z"
```

##### Resultado
La salida es la nueva fecha después de restar el tiempo.


#### 4. :startOfD(unit, patternIn)

##### Explicación de la sintaxis
Establece la fecha al momento inicial de la unidad de tiempo especificada.  
Parámetros:
- unit: Unidad de tiempo
- patternIn: Opcional, formato de entrada

##### Ejemplo
```
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Salida "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Salida "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Salida "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Salida "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Salida "2016-01-01T00:00:00.000Z"
```

##### Resultado
La salida es la cadena de fecha del momento inicial.


#### 5. :endOfD(unit, patternIn)

##### Explicación de la sintaxis
Establece la fecha al momento final de la unidad de tiempo especificada.  
Parámetros iguales a los anteriores.

##### Ejemplo
```
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Salida "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Salida "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Salida "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Salida "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Salida "2016-01-31T23:59:59.999Z"
```

##### Resultado
La salida es la cadena de fecha del momento final.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Explicación de la sintaxis
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
- toDate: Fecha objetivo
- unit: Unidad de salida
- patternFromDate: Opcional, formato de la fecha inicial
- patternToDate: Opcional, formato de la fecha objetivo

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
La salida es la diferencia de tiempo entre las dos fechas, convertida según la unidad especificada.


#### 7. :convDate(patternIn, patternOut)

##### Explicación de la sintaxis
Convierte una fecha de un formato a otro. (No se recomienda su uso)  
Parámetros:
- patternIn: Formato de fecha de entrada
- patternOut: Formato de fecha de salida

##### Ejemplo
```
'20160131':convDate('YYYYMMDD', 'L')      // Salida "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Salida "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Salida "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Salida "Sunday"
1410715640:convDate('X', 'LLLL')          // Salida "Sunday, September 14, 2014 7:27 PM"
```

##### Resultado
La salida es la cadena de fecha convertida.


#### 8. Patrones de formato de fecha
Descripción de los patrones de formato de fecha comunes (consulte la descripción de DayJS):
- `X`: Marca de tiempo Unix (segundos), como 1360013296
- `x`: Marca de tiempo Unix en milisegundos, como 1360013296123
- `YY`: Año de dos dígitos, como 18
- `YYYY`: Año de cuatro dígitos, como 2018
- `M`, `MM`, `MMM`, `MMMM`: Mes (número, dos dígitos, abreviado, nombre completo)
- `D`, `DD`: Día (número, dos dígitos)
- `d`, `dd`, `ddd`, `dddd`: Semana (número, mínimo, abreviado, nombre completo)
- `H`, `HH`, `h`, `hh`: Hora (formato de 24 horas o 12 horas)
- `m`, `mm`: Minutos
- `s`, `ss`: Segundos
- `SSS`: Milisegundos (3 dígitos)
- `Z`, `ZZ`: Desplazamiento UTC, como +05:00 o +0500
- `A`, `a`: AM/PM
- `Q`: Trimestre (1-4)
- `Do`: Día con ordinal, como 1st, 2nd, …
- Para otros formatos, consulte la documentación completa.  
  Además, existen formatos localizados basados en el idioma: como `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, etc.