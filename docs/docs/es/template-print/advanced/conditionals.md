:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

## Sentencias Condicionales

Las sentencias condicionales le permiten controlar dinámicamente la visualización u ocultamiento del contenido en un documento, basándose en los valores de los datos. Ofrecemos tres formas principales de escribir condiciones:

-   **Condiciones en línea**: Para mostrar texto directamente (o reemplazarlo por otro).
-   **Bloques condicionales**: Para mostrar u ocultar una sección del documento, ideal para múltiples etiquetas, párrafos, tablas, etc.
-   **Condiciones inteligentes**: Para eliminar o conservar elementos específicos del documento (como filas, párrafos, imágenes, etc.) con una sola etiqueta, ofreciendo una sintaxis más concisa.

Todas las condiciones comienzan con un formateador de evaluación lógica (por ejemplo, `ifEQ`, `ifGT`, etc.), seguido de formateadores de acción (como `show`, `elseShow`, `drop`, `keep`, etc.).

### Resumen

Los operadores lógicos y formateadores de acción admitidos en las sentencias condicionales incluyen:

-   **Operadores Lógicos**
    -   **ifEQ(value)**: Comprueba si el dato es igual al valor especificado.
    -   **ifNE(value)**: Comprueba si el dato es diferente al valor especificado.
    -   **ifGT(value)**: Comprueba si el dato es mayor que el valor especificado.
    -   **ifGTE(value)**: Comprueba si el dato es mayor o igual que el valor especificado.
    -   **ifLT(value)**: Comprueba si el dato es menor que el valor especificado.
    -   **ifLTE(value)**: Comprueba si el dato es menor o igual que el valor especificado.
    -   **ifIN(value)**: Comprueba si el dato está contenido en un array o cadena de texto.
    -   **ifNIN(value)**: Comprueba si el dato NO está contenido en un array o cadena de texto.
    -   **ifEM()**: Comprueba si el dato está vacío (por ejemplo, `null`, `undefined`, una cadena vacía, un array vacío o un objeto vacío).
    -   **ifNEM()**: Comprueba si el dato NO está vacío.
    -   **ifTE(type)**: Comprueba si el tipo de dato es igual al tipo especificado (por ejemplo, "string", "number", "boolean", etc.).
    -   **and(value)**: Operador lógico "y", utilizado para conectar múltiples condiciones.
    -   **or(value)**: Operador lógico "o", utilizado para conectar múltiples condiciones.

-   **Formateadores de Acción**
    -   **:show(text) / :elseShow(text)**: Se utilizan en condiciones en línea para mostrar directamente el texto especificado.
    -   **:hideBegin / :hideEnd** y **:showBegin / :showEnd**: Se utilizan en bloques condicionales para ocultar o mostrar secciones del documento.
    -   **:drop(element) / :keep(element)**: Se utilizan en condiciones inteligentes para eliminar o conservar elementos específicos del documento.

A continuación, presentaremos la sintaxis detallada, ejemplos y resultados para cada uso.

### Condiciones en línea

#### 1. :show(text) / :elseShow(text)

##### Sintaxis
```
{data:condition:show(text)}
{data:condition:show(text):elseShow(alternative text)}
```

##### Ejemplo
Supongamos que los datos son:
```json
{
  "val2": 2,
  "val5": 5
}
```
La plantilla es la siguiente:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Resultado
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Switch Case (Condiciones Múltiples)

##### Sintaxis
Utilice formateadores de condición consecutivos para construir una estructura similar a un `switch-case`:
```
{data:ifEQ(value1):show(result1):ifEQ(value2):show(result2):elseShow(default result)}
```
O logre lo mismo con el operador `or`:
```
{data:ifEQ(value1):show(result1):or(data):ifEQ(value2):show(result2):elseShow(default result)}
```

##### Ejemplo
Datos:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Plantilla:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Resultado
```
val1 = A
val2 = B
val3 = C
```

#### 3. Condiciones Multivariable

##### Sintaxis
Utilice los operadores lógicos `and`/`or` para evaluar múltiples variables:
```
{data1:ifEQ(condition1):and(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
{data1:ifEQ(condition1):or(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
```

##### Ejemplo
Datos:
```json
{
  "val2": 2,
  "val5": 5
}
```
Plantilla:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Resultado
```
and = KO
or = OK
```

### Operadores Lógicos y Formateadores

En las siguientes secciones, los formateadores descritos utilizan la sintaxis de condición en línea con el siguiente formato:
```
{data:formatter(parameter):show(text):elseShow(alternative text)}
```

#### 1. :and(value)

##### Sintaxis
```
{data:ifEQ(value):and(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Ejemplo
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Resultado
Si `d.car` es igual a `'delorean'` Y `d.speed` es mayor que 80, el resultado es `TravelInTime`; de lo contrario, el resultado es `StayHere`.

#### 2. :or(value)

##### Sintaxis
```
{data:ifEQ(value):or(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### Ejemplo
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Resultado
Si `d.car` es igual a `'delorean'` O `d.speed` es mayor que 80, el resultado es `TravelInTime`; de lo contrario, el resultado es `StayHere`.

#### 3. :ifEM()

##### Sintaxis
```
{data:ifEM():show(text):elseShow(alternative text)}
```

##### Ejemplo
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Resultado
Para `null` o un array vacío, el resultado es `Result true`; de lo contrario, es `Result false`.

#### 4. :ifNEM()

##### Sintaxis
```
{data:ifNEM():show(text):elseShow(alternative text)}
```

##### Ejemplo
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Resultado
Para datos no vacíos (como el número 0 o la cadena de texto 'homer'), el resultado es `Result true`; para datos vacíos, el resultado es `Result false`.

#### 5. :ifEQ(value)

##### Sintaxis
```
{data:ifEQ(value):show(text):elseShow(alternative text)}
```

##### Ejemplo
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Resultado
Si el dato es igual al valor especificado, el resultado es `Result true`; de lo contrario, es `Result false`.

#### 6. :ifNE(value)

##### Sintaxis
```
{data:ifNE(value):show(text):elseShow(alternative text)}
```

##### Ejemplo
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Resultado
El primer ejemplo da como resultado `Result false`, mientras que el segundo da `Result true`.

#### 7. :ifGT(value)

##### Sintaxis
```
{data:ifGT(value):show(text):elseShow(alternative text)}
```

##### Ejemplo
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Resultado
El primer ejemplo da como resultado `Result true`, y el segundo da `Result false`.

#### 8. :ifGTE(value)

##### Sintaxis
```
{data:ifGTE(value):show(text):elseShow(alternative text)}
```

##### Ejemplo
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Resultado
El primer ejemplo da como resultado `Result true`, mientras que el segundo da `Result false`.

#### 9. :ifLT(value)

##### Sintaxis
```
{data:ifLT(value):show(text):elseShow(alternative text)}
```

##### Ejemplo
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Resultado
El primer ejemplo da como resultado `Result true`, y el segundo da `Result false`.

#### 10. :ifLTE(value)

##### Sintaxis
```
{data:ifLTE(value):show(text):elseShow(alternative text)}
```

##### Ejemplo
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Resultado
El primer ejemplo da como resultado `Result true`, y el segundo da `Result false`.

#### 11. :ifIN(value)

##### Sintaxis
```
{data:ifIN(value):show(text):elseShow(alternative text)}
```

##### Ejemplo
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Resultado
Ambos ejemplos dan como resultado `Result true` (porque la cadena de texto contiene 'is' y el array contiene 2).

#### 12. :ifNIN(value)

##### Sintaxis
```
{data:ifNIN(value):show(text):elseShow(alternative text)}
```

##### Ejemplo
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Resultado
El primer ejemplo da como resultado `Result false` (porque la cadena de texto contiene 'is'), y el segundo da `Result false` (porque el array contiene 2).

#### 13. :ifTE(type)

##### Sintaxis
```
{data:ifTE('type'):show(text):elseShow(alternative text)}
```

##### Ejemplo
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Resultado
El primer ejemplo da como resultado `Result true` (ya que 'homer' es una cadena de texto), y el segundo da `Result true` (ya que 10.5 es un número).

### Bloques Condicionales

Los bloques condicionales se utilizan para mostrar u ocultar una sección del documento, generalmente para encerrar múltiples etiquetas o un bloque de texto completo.

#### 1. :showBegin / :showEnd

##### Sintaxis
```
{data:ifEQ(condition):showBegin}
Document block content
{data:showEnd}
```

##### Ejemplo
Datos:
```json
{
  "toBuy": true
}
```
Plantilla:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Resultado
Cuando se cumple la condición, el contenido intermedio se muestra:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### Sintaxis
```
{data:ifEQ(condition):hideBegin}
Document block content
{data:hideEnd}
```

##### Ejemplo
Datos:
```json
{
  "toBuy": true
}
```
Plantilla:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Resultado
Cuando se cumple la condición, el contenido intermedio se oculta, dando como resultado:
```
Banana
Grapes
```