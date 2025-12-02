:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

### Formato de Números

#### 1. :formatN(precision)

##### Explicación de la sintaxis
Formatea un número según la configuración de localización.
Parámetro:
- `precision`: El número de decimales.
  Para los formatos ODS/XLSX, el número de decimales mostrados lo determina el editor de texto; para otros formatos, se utiliza este parámetro.

##### Ejemplo
```
// Ejemplo de entorno: Opciones de API { "lang": "en-us" }
'10':formatN()         // Salida "10.000"
'1000.456':formatN()   // Salida "1,000.456"
```

##### Resultado
El número se muestra según la precisión especificada y el formato de localización.

#### 2. :round(precision)

##### Explicación de la sintaxis
Redondea el número a la cantidad de decimales especificada.

##### Ejemplo
```
10.05123:round(2)      // Salida 10.05
1.05:round(1)          // Salida 1.1
```

##### Resultado
La salida es el número redondeado con la precisión indicada.

#### 3. :add(value)

##### Explicación de la sintaxis
Suma el valor especificado al número actual.
Parámetro:
- `value`: El número a sumar.

##### Ejemplo
```
1000.4:add(2)         // Salida 1002.4
'1000.4':add('2')      // Salida 1002.4
```

##### Resultado
La salida es la suma del número actual y el valor especificado.

#### 4. :sub(value)

##### Explicación de la sintaxis
Resta el valor especificado al número actual.
Parámetro:
- `value`: El número a restar.

##### Ejemplo
```
1000.4:sub(2)         // Salida 998.4
'1000.4':sub('2')      // Salida 998.4
```

##### Resultado
La salida es el número actual menos el valor especificado.

#### 5. :mul(value)

##### Explicación de la sintaxis
Multiplica el número actual por el valor especificado.
Parámetro:
- `value`: El multiplicador.

##### Ejemplo
```
1000.4:mul(2)         // Salida 2000.8
'1000.4':mul('2')      // Salida 2000.8
```

##### Resultado
La salida es el producto del número actual y el valor especificado.

#### 6. :div(value)

##### Explicación de la sintaxis
Divide el número actual por el valor especificado.
Parámetro:
- `value`: El divisor.

##### Ejemplo
```
1000.4:div(2)         // Salida 500.2
'1000.4':div('2')      // Salida 500.2
```

##### Resultado
La salida es el resultado de la división.

#### 7. :mod(value)

##### Explicación de la sintaxis
Calcula el módulo (resto) del número actual dividido por el valor especificado.
Parámetro:
- `value`: El divisor del módulo.

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
Redondea el número hacia arriba, es decir, devuelve el entero más pequeño que es mayor o igual que el número actual.

##### Ejemplo
```
10.05123:ceil()       // Salida 11
1.05:ceil()           // Salida 2
-1.05:ceil()          // Salida -1
```

##### Resultado
La salida es el entero redondeado hacia arriba.

#### 10. :floor

##### Explicación de la sintaxis
Redondea el número hacia abajo, es decir, devuelve el entero más grande que es menor o igual que el número actual.

##### Ejemplo
```
10.05123:floor()      // Salida 10
1.05:floor()          // Salida 1
-1.05:floor()         // Salida -2
```

##### Resultado
La salida es el entero redondeado hacia abajo.

#### 11. :int

##### Explicación de la sintaxis
Convierte el número a un entero (no se recomienda su uso).

##### Ejemplo y resultado
Depende del caso de conversión específico.

#### 12. :toEN

##### Explicación de la sintaxis
Convierte el número a formato inglés (usando `.` como separador decimal). No se recomienda su uso.

##### Ejemplo y resultado
Depende del caso de conversión específico.

#### 13. :toFixed

##### Explicación de la sintaxis
Convierte el número a una cadena de texto, manteniendo solo el número especificado de decimales. No se recomienda su uso.

##### Ejemplo y resultado
Depende del caso de conversión específico.

#### 14. :toFR

##### Explicación de la sintaxis
Convierte el número a formato francés (usando `,` como separador decimal). No se recomienda su uso.

##### Ejemplo y resultado
Depende del caso de conversión específico.