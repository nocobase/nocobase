:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/template-print/syntax/formatters/currency-formatting).
:::

### Formateo de moneda

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Explicación de la sintaxis
Formatea números de moneda, permitiendo especificar el número de decimales o un formato de salida específico.  
Parámetros:
- precisionOrFormat: Parámetro opcional, puede ser un número (especifica el número de decimales) o un identificador de formato específico:
  - Entero: Cambia la precisión decimal predeterminada
  - `'M'`: Solo muestra el nombre principal de la moneda
  - `'L'`: Muestra el número junto con el símbolo de la moneda (predeterminado)
  - `'LL'`: Muestra el número junto con el nombre principal de la moneda
- targetCurrency: Opcional, código de la moneda de destino (en mayúsculas, como USD, EUR), anulará la configuración global

##### Ejemplo
```
'1000.456':formatC()      // Salida "$2,000.91"
'1000.456':formatC('M')    // Salida "dollars"
'1':formatC('M')           // Salida "dollar"
'1000':formatC('L')        // Salida "$2,000.00"
'1000':formatC('LL')       // Salida "2,000.00 dollars"
```

##### Resultado
El resultado de la salida depende de las opciones de la API y de la configuración de la tasa de cambio.


#### 2. :convCurr(target, source)

##### Explicación de la sintaxis
Convierte un número de una moneda a otra. La tasa de cambio puede pasarse a través de las opciones de la API o configurarse globalmente.  
Si no se especifican parámetros, se convierte automáticamente de `options.currencySource` a `options.currencyTarget`.  
Parámetros:
- target: Opcional, código de la moneda de destino (por defecto es igual a `options.currencyTarget`)
- source: Opcional, código de la moneda de origen (por defecto es igual a `options.currencySource`)

##### Ejemplo
```
10:convCurr()              // Salida 20
1000:convCurr()            // Salida 2000
1000:convCurr('EUR')        // Salida 1000
1000:convCurr('USD')        // Salida 2000
1000:convCurr('USD', 'USD') // Salida 1000
```

##### Resultado
La salida es el valor numérico de la moneda convertida.