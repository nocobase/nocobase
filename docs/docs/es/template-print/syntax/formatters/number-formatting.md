:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/template-print/syntax/formatters/number-formatting).
:::

### Formateo de números

#### 1. :formatN(precision)

##### Explicación de la sintaxis
Formatea el número según la configuración de localización.  
Parámetros:
- precision: número de decimales  
  Para los formatos ODS/XLSX, el número de decimales mostrados lo determina el editor de texto; otros formatos dependen de este parámetro.

##### Ejemplo
```
'10':formatN()         // Salida "10.000"
'1000.456':formatN()   // Salida "1,000.456"
```

##### Resultado
El número se emite según la precisión especificada y el formato de localización.


#### 2. :round(precision)

##### Explicación de la sintaxis
Realiza un redondeo del número; el parámetro especifica el número de decimales.

##### Ejemplo
```
10.05123:round(2)      // Salida 10.05
1.05:round(1)          // Salida 1.1
```

##### Resultado
La salida es el valor tras el redondeo.


#### 3. :add(value)

##### Explicación de la sintaxis
Suma el valor especificado al número actual.  
Parámetros:
- value: el número a sumar

##### Ejemplo
```
1000.4:add(2)         // Salida 1002.4
'1000.4':add('2')      // Salida 1002.4
```

##### Resultado
La salida es el valor tras la suma.


#### 4. :sub(value)

##### Explicación de la sintaxis
Resta el valor especificado al número actual.  
Parámetros:
- value: el sustraendo

##### Ejemplo
```
1000.4:sub(2)         // Salida 998.4
'1000.4':sub('2')      // Salida 998.4
```

##### Resultado
La salida es el valor tras la resta.


#### 5. :mul(value)

##### Explicación de la sintaxis
Multiplica el número actual por el valor especificado.  
Parámetros:
- value: el multiplicador

##### Ejemplo
```
1000.4:mul(2)         // Salida 2000.8
'1000.4':mul('2')      // Salida 2000.8
```

##### Resultado
La salida es el valor tras la multiplicación.


#### 6. :div(value)

##### Explicación de la sintaxis
Divide el número actual por el valor especificado.  
Parámetros:
- value: el divisor

##### Ejemplo
```
1000.4:div(2)         // Salida 500.2
'1000.4':div('2')      // Salida 500.2
```

##### Resultado
La salida es el valor tras la división.


#### 7. :mod(value)

##### Explicación de la sintaxis
Calcula el módulo (resto) del número actual respecto al valor especificado.  
Parámetros:
- value: el módulo

##### Ejemplo
```
4:mod(2)              // Salida 0
3:mod(2)              // Salida 1
```

##### Resultado
La salida es el resultado de la operación de módulo.


#### 8. :abs

##### Explicación de la sintaxis
Devuelve el valor absoluto del número.

##### Ejemplo
```
-10:abs()             // Salida 10
-10.54:abs()          // Salida 10.54
10.54:abs()           // Salida 10.54
'-200':abs()          // Salida 200
```

##### Resultado
La salida es el valor absoluto.


#### 9. :ceil

##### Explicación de la sintaxis
Redondea hacia arriba, es decir, devuelve el entero mínimo que es mayor o igual al número actual.

##### Ejemplo
```
10.05123:ceil()       // Salida 11
1.05:ceil()           // Salida 2
-1.05:ceil()          // Salida -1
```

##### Resultado
La salida es el entero tras el redondeo.


#### 10. :floor

##### Explicación de la sintaxis
Redondea hacia abajo, es decir, devuelve el entero máximo que es menor o igual al número actual.

##### Ejemplo
```
10.05123:floor()      // Salida 10
1.05:floor()          // Salida 1
-1.05:floor()         // Salida -2
```

##### Resultado
La salida es el entero tras el redondeo.


#### 11. :int

##### Explicación de la sintaxis
Convierte el número en un entero (no se recomienda su uso).

##### Ejemplo y resultado
Según el caso específico de conversión.


#### 12. :toEN

##### Explicación de la sintaxis
Convierte el número al formato inglés (el punto decimal es '.'), no se recomienda su uso.

##### Ejemplo y resultado
Según el caso específico de conversión.


#### 13. :toFixed

##### Explicación de la sintaxis
Convierte el número en una cadena de texto, conservando solo el número especificado de decimales; no se recomienda su uso.

##### Ejemplo y resultado
Según el caso específico de conversión.


#### 14. :toFR

##### Explicación de la sintaxis
Convierte el número al formato francés (el punto decimal es ','), no se recomienda su uso.

##### Ejemplo y resultado
Según el caso específico de conversión.