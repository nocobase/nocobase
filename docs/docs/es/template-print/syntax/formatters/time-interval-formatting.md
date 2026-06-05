:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

### Formato de Intervalos

#### 1. :formatI(patternOut, patternIn)

##### Explicación de la Sintaxis
Formatea una duración o un intervalo. Los formatos de salida admitidos incluyen:
- `human+` o `human` (ideales para una visualización más legible y amigable)
- Unidades como `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (o sus abreviaturas).

Parámetros:
- **patternOut:** El formato de salida (por ejemplo, `'second'` o `'human+'`).
- **patternIn:** Opcional, la unidad de entrada (por ejemplo, `'milliseconds'` o `'s'`).

##### Ejemplo
```
// Entorno del ejemplo: opciones de la API { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Devuelve 2
2000:formatI('seconds')      // Devuelve 2
2000:formatI('s')            // Devuelve 2
3600000:formatI('minute')    // Devuelve 60
3600000:formatI('hour')      // Devuelve 1
2419200000:formatI('days')   // Devuelve 28

// Ejemplo en francés:
2000:formatI('human')        // Devuelve "quelques secondes"
2000:formatI('human+')       // Devuelve "dans quelques secondes"
-2000:formatI('human+')      // Devuelve "il y a quelques secondes"

// Ejemplo en inglés:
2000:formatI('human')        // Devuelve "a few seconds"
2000:formatI('human+')       // Devuelve "in a few seconds"
-2000:formatI('human+')      // Devuelve "a few seconds ago"

// Ejemplo de conversión de unidades:
60:formatI('ms', 'minute')   // Devuelve 3600000
4:formatI('ms', 'weeks')      // Devuelve 2419200000
'P1M':formatI('ms')          // Devuelve 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Devuelve 10296.085
```

##### Resultado
El resultado de la salida se muestra como la duración o el intervalo correspondiente, basándose en el valor de entrada y la conversión de unidades.