:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

### Formato de Arrays

#### 1. :arrayJoin(separator, index, count)

##### Explicación de la sintaxis
Une un array de cadenas de texto o números en una sola cadena.  
Parámetros:
- **`separator`**: El delimitador (por defecto es una coma `,`).
- **`index`**: Opcional. El índice desde el cual empezar a unir.
- **`count`**: Opcional. El número de elementos a unir a partir de `index` (puede ser negativo para contar desde el final).

##### Ejemplo
```
['homer','bart','lisa']:arrayJoin()              // Salida: "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Salida: "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Salida: "homerbartlisa"
[10,50]:arrayJoin()                               // Salida: "10, 50"
[]:arrayJoin()                                    // Salida: ""
null:arrayJoin()                                  // Salida: null
{}:arrayJoin()                                    // Salida: {}
20:arrayJoin()                                    // Salida: 20
undefined:arrayJoin()                             // Salida: undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Salida: "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Salida: "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Salida: "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Salida: "homerbart"
```

##### Resultado
La salida es una cadena de texto creada al unir los elementos del array según los parámetros especificados.


#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Explicación de la sintaxis
Transforma un array de objetos en una cadena de texto. No procesa objetos o arrays anidados.  
Parámetros:
- **`objSeparator`**: El separador entre objetos (por defecto es `, `).
- **`attSeparator`**: El separador entre atributos de objeto (por defecto es `:`).
- **`attributes`**: Opcional. Una lista de atributos de objeto a incluir en la salida.

##### Ejemplo
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Salida: "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Salida: "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Salida: "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Salida: "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Salida: "2:homer"

['homer','bart','lisa']:arrayMap()    // Salida: "homer, bart, lisa"
[10,50]:arrayMap()                    // Salida: "10, 50"
[]:arrayMap()                         // Salida: ""
null:arrayMap()                       // Salida: null
{}:arrayMap()                         // Salida: {}
20:arrayMap()                         // Salida: 20
undefined:arrayMap()                  // Salida: undefined
```

##### Resultado
La salida es una cadena de texto generada al mapear y unir los elementos del array, ignorando el contenido de objetos anidados.


#### 3. :count(start)

##### Explicación de la sintaxis
Cuenta el número de fila en un array y devuelve el número de fila actual.  
Por ejemplo:
```
{d[i].id:count()}
```  
Independientemente del valor de `id`, devuelve el conteo de la fila actual.  
A partir de la v4.0.0, este formateador ha sido reemplazado internamente por `:cumCount`.

Parámetro:
- **`start`**: Opcional. El valor inicial para el conteo.

##### Ejemplo y Resultado
En la práctica, la salida mostrará el número de fila según la secuencia de los elementos del array.