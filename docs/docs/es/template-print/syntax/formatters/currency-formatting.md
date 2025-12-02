:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

### Formato de Moneda

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Explicación de la Sintaxis
Formatea un número de moneda y le permite especificar el número de decimales o un formato de salida particular.

Parámetros:
- `precisionOrFormat`: Un parámetro opcional que puede ser un número (para especificar la cantidad de decimales) o un identificador de formato:
  - Un número entero: cambia la precisión decimal predeterminada.
  - `'M'`: Muestra solo el nombre principal de la moneda.
  - `'L'`: Muestra el número junto con el símbolo de la moneda (opción predeterminada).
  - `'LL'`: Muestra el número junto con el nombre principal de la moneda.
- `targetCurrency`: Opcional; el código de la moneda de destino (en mayúsculas, por ejemplo, USD, EUR) que anula la configuración global.

##### Ejemplo
```
// Entorno de ejemplo: opciones de la API { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Muestra "$2,000.91"
'1000.456':formatC('M')    // Muestra "dollars"
'1':formatC('M')           // Muestra "dollar"
'1000':formatC('L')        // Muestra "$2,000.00"
'1000':formatC('LL')       // Muestra "2,000.00 dollars"

// Ejemplo en francés (cuando la configuración del entorno es diferente):
'1000.456':formatC()      // Muestra "2 000,91 ..."  
'1000.456':formatC()      // Cuando las monedas de origen y destino son las mismas, muestra "1 000,46 €"
```

##### Resultado
El resultado que se muestra depende de las opciones de la API y de la configuración del tipo de cambio.

#### 2. :convCurr(target, source)

##### Explicación de la Sintaxis
Convierte un número de una moneda a otra. El tipo de cambio se puede pasar a través de las opciones de la API o configurarse globalmente.

Si no se especifican parámetros, la conversión se realiza automáticamente de `options.currencySource` a `options.currencyTarget`.

Parámetros:
- `target`: Opcional; el código de la moneda de destino (por defecto es `options.currencyTarget`).
- `source`: Opcional; el código de la moneda de origen (por defecto es `options.currencySource`).

##### Ejemplo
```
// Entorno de ejemplo: opciones de la API { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Muestra 20
1000:convCurr()            // Muestra 2000
1000:convCurr('EUR')        // Muestra 1000
1000:convCurr('USD')        // Muestra 2000
1000:convCurr('USD', 'USD') // Muestra 1000
```

##### Resultado
El resultado es el valor de la moneda convertida.