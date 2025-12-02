:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

## Formateadores

Los formateadores se utilizan para convertir datos sin procesar en texto fácil de leer. Se aplican a los datos usando dos puntos (`:`) y pueden encadenarse de modo que la salida de un formateador se convierte en la entrada del siguiente. Algunos formateadores admiten parámetros constantes o dinámicos.


### Resumen

#### 1. Explicación de la sintaxis
La invocación básica de un formateador es la siguiente:
```
{d.propiedad:formateador1:formateador2(...)}
```  
Por ejemplo, para convertir la cadena de texto `"JOHN"` a `"John"`, primero se utiliza el formateador `lowerCase` para convertir todas las letras a minúsculas, y luego `ucFirst` para poner en mayúscula la primera letra.

#### 2. Ejemplo
Datos:
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Plantilla:
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Resultado
Después de la renderización, la salida es:
```
My name is John. I was born on January 31, 2000.
```


### Parámetros constantes

#### 1. Explicación de la sintaxis
Muchos formateadores admiten uno o más parámetros constantes, que se separan por comas y se encierran entre paréntesis para modificar la salida. Por ejemplo, `:prepend(myPrefix)` añadirá "myPrefix" delante del texto.  
**Nota:** Si el parámetro contiene comas o espacios, debe encerrarse entre comillas simples, por ejemplo: `prepend('my prefix')`.

#### 2. Ejemplo
Ejemplo de plantilla (consulte el uso específico del formateador para más detalles).

#### 3. Resultado
La salida tendrá el prefijo especificado añadido delante del texto.


### Parámetros dinámicos

#### 1. Explicación de la sintaxis
Los formateadores también admiten parámetros dinámicos. Estos parámetros comienzan con un punto (`.`) y no se encierran entre comillas.  
Hay dos métodos para especificar parámetros dinámicos:
- **Ruta JSON absoluta:** Comienza con `d.` o `c.` (refiriéndose a los datos raíz o a los datos suplementarios).
- **Ruta JSON relativa:** Comienza con un solo punto (`.`), indicando que la propiedad se busca desde el objeto padre actual.

Por ejemplo:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
También se puede escribir como una ruta relativa:
```
{d.subObject.qtyB:add(.qtyC)}
```
Si necesita acceder a datos de un nivel superior (padre o superior), puede usar varios puntos:
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. Ejemplo
Datos:
```json
{
  "id": 10,
  "qtyA": 20,
  "subObject": {
    "qtyB": 5,
    "qtyC": 3
  },
  "subArray": [{
    "id": 1000,
    "qtyE": 3
  }]
}
```
Uso en la plantilla:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Resultado: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Resultado: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Resultado: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Resultado: 6 (3 + 3)
```

#### 3. Resultado
Los ejemplos producen 8, 8, 28 y 6 respectivamente.

> **Nota:** No se permite el uso de iteradores personalizados o filtros de array como parámetros dinámicos, por ejemplo:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```