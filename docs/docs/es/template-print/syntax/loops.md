:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

## Procesamiento de Bucles

El procesamiento de bucles se utiliza para renderizar repetidamente datos de arreglos u objetos. Se logra definiendo marcadores de inicio y fin para identificar el contenido que necesita repetirse. A continuación, exploraremos algunos escenarios comunes.

### Iteración sobre Arreglos

#### 1. Descripción de la Sintaxis

- Utilice la etiqueta `{d.array[i].propiedad}` para definir el elemento actual del bucle, y `{d.array[i+1].propiedad}` para especificar el siguiente elemento, delimitando así el área del bucle.
- Durante la iteración, la primera línea (la parte `[i]`) se utiliza automáticamente como plantilla para la repetición; solo necesita escribir el ejemplo del bucle una vez en la plantilla.

Formato de sintaxis de ejemplo:
```
{d.nombreDelArreglo[i].propiedad}
{d.nombreDelArreglo[i+1].propiedad}
```

#### 2. Ejemplo: Bucle Simple sobre Arreglos

##### Datos
```json
{
  "cars": [
    { "brand": "Toyota", "id": 1 },
    { "brand": "Hyundai", "id": 2 },
    { "brand": "BMW",    "id": 3 },
    { "brand": "Peugeot","id": 4 }
  ]
}
```

##### Plantilla
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### Resultado
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```

#### 3. Ejemplo: Bucle sobre Arreglos Anidados

Es útil para situaciones donde un arreglo contiene otros arreglos anidados; el anidamiento puede ser de niveles infinitos.

##### Datos
```json
[
  {
    "brand": "Toyota",
    "models": [
      { "size": "Prius 4", "power": 125 },
      { "size": "Prius 5", "power": 139 }
    ]
  },
  {
    "brand": "Kia",
    "models": [
      { "size": "EV4", "power": 450 },
      { "size": "EV6", "power": 500 }
    ]
  }
]
```

##### Plantilla
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### Resultado
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```

#### 4. Ejemplo: Bucle Bidireccional (Característica Avanzada, v4.8.0+)

Los bucles bidireccionales permiten iterar simultáneamente sobre filas y columnas, lo cual es ideal para generar tablas comparativas y otros diseños complejos (nota: actualmente, algunos formatos solo son compatibles oficialmente con plantillas DOCX, HTML y MD).

##### Datos
```json
{
  "titles": [
    { "name": "Kia" },
    { "name": "Toyota" },
    { "name": "Hopium" }
  ],
  "cars": [
    { "models": [ "EV3", "Prius 1", "Prototype" ] },
    { "models": [ "EV4", "Prius 2", "" ] },
    { "models": [ "EV6", "Prius 3", "" ] }
  ]
}
```

##### Plantilla
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### Resultado
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```

#### 5. Ejemplo: Acceso a los Valores del Iterador del Bucle (v4.0.0+)

Dentro de un bucle, puede acceder directamente al valor del índice de la iteración actual, lo que facilita la implementación de requisitos de formato especiales.

##### Ejemplo de Plantilla
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Nota: La cantidad de puntos indica el nivel del índice (por ejemplo, `.i` representa el nivel actual, mientras que `..i` representa el nivel anterior). Actualmente existe un problema con el orden inverso; consulte la documentación oficial para más detalles.

### Iteración sobre Objetos

#### 1. Descripción de la Sintaxis

- Para las propiedades de un objeto, puede usar `.att` para obtener el nombre de la propiedad y `.val` para obtener su valor.
- Durante la iteración, cada elemento de propiedad se recorre uno por uno.

Formato de sintaxis de ejemplo:
```
{d.nombreDelObjeto[i].att}  // Nombre de la propiedad
{d.nombreDelObjeto[i].val}  // Valor de la propiedad
```

#### 2. Ejemplo: Iteración de Propiedades de Objeto

##### Datos
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### Plantilla
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### Resultado
```
People namePeople age
paul10
jack20
bob30
```

### Ordenamiento

La función de ordenamiento le permite organizar directamente los datos de un arreglo dentro de la plantilla.

#### 1. Descripción de la Sintaxis: Ordenamiento Ascendente

- Utilice un atributo como criterio de ordenamiento en la etiqueta del bucle. El formato de sintaxis es:
  ```
  {d.arreglo[atributoDeOrdenamiento, i].propiedad}
  {d.arreglo[atributoDeOrdenamiento+1, i+1].propiedad}
  ```
- Si necesita múltiples criterios de ordenamiento, separe los atributos con comas dentro de los corchetes.

#### 2. Ejemplo: Ordenamiento por Atributo Numérico

##### Datos
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3 },
    { "brand": "Peugeot", "power": 1 },
    { "brand": "BMW",     "power": 2 },
    { "brand": "Lexus",   "power": 1 }
  ]
}
```

##### Plantilla
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### Resultado
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. Ejemplo: Ordenamiento por Múltiples Atributos

##### Datos
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3, "sub": { "size": 1 } },
    { "brand": "Aptera",  "power": 1, "sub": { "size": 20 } },
    { "brand": "Peugeot", "power": 1, "sub": { "size": 20 } },
    { "brand": "BMW",     "power": 2, "sub": { "size": 1 } },
    { "brand": "Kia",     "power": 1, "sub": { "size": 10 } }
  ]
}
```

##### Plantilla
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### Resultado
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```

### Filtrado

El procesamiento de filtrado se utiliza para filtrar filas de datos en un bucle basándose en condiciones específicas.

#### 1. Descripción de la Sintaxis: Filtrado Numérico

- Agregue condiciones en la etiqueta del bucle (por ejemplo, `age > 19`). El formato de sintaxis es:
  ```
  {d.arreglo[i, condición].propiedad}
  ```

#### 2. Ejemplo: Filtrado Numérico

##### Datos
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### Plantilla
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### Resultado
```
People
John
Bob
```

#### 3. Descripción de la Sintaxis: Filtrado de Cadenas

- Especifique las condiciones de cadena utilizando comillas simples. Por ejemplo:
  ```
  {d.arreglo[i, type='rocket'].name}
  ```

#### 4. Ejemplo: Filtrado de Cadenas

##### Datos
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### Plantilla
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### Resultado
```
People
Falcon 9
Falcon Heavy
```

#### 5. Descripción de la Sintaxis: Filtrar los Primeros N Elementos

- Puede usar el índice del bucle `i` para filtrar los primeros N elementos. Por ejemplo:
  ```
  {d.arreglo[i, i < N].propiedad}
  ```

#### 6. Ejemplo: Filtrar los Dos Primeros Elementos

##### Datos
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Plantilla
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### Resultado
```
People
Falcon 9
Model S
```

#### 7. Descripción de la Sintaxis: Excluir los Últimos N Elementos

- Utilice el indexado negativo `i` para representar los elementos desde el final. Por ejemplo:
  - `{d.arreglo[i=-1].propiedad}` recupera el último elemento.
  - `{d.arreglo[i, i!=-1].propiedad}` excluye el último elemento.

#### 8. Ejemplo: Excluyendo el Último y los Dos Últimos Elementos

##### Datos
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Plantilla
```
Último elemento: {d[i=-1].name}

Excluyendo el último elemento:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Excluyendo los dos últimos elementos:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Resultado
```
Último elemento: Falcon Heavy

Excluyendo el último elemento:
Falcon 9
Model S
Model 3

Excluyendo los dos últimos elementos:
Falcon 9
Model S
```

#### 9. Descripción de la Sintaxis: Filtrado Inteligente

- Mediante bloques de condiciones inteligentes, puede ocultar una fila completa basándose en condiciones complejas. Por ejemplo:
  ```
  {d.arreglo[i].propiedad:ifIN('palabraClave'):drop(row)}
  ```

#### 10. Ejemplo: Filtrado Inteligente

##### Datos
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Plantilla
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### Resultado
```
People
Model S
Model 3
```
(Nota: Las filas de la plantilla que contienen "Falcon" son eliminadas por la condición de filtrado inteligente.)

### Deduplicación

#### 1. Descripción de la Sintaxis

- Mediante un iterador personalizado, puede obtener elementos únicos (no duplicados) basándose en el valor de una propiedad. La sintaxis es similar a la de un bucle normal, pero ignora automáticamente los elementos duplicados.

Formato de ejemplo:
```
{d.arreglo[propiedad].propiedad}
{d.arreglo[propiedad+1].propiedad}
```

#### 2. Ejemplo: Selección de Datos Únicos

##### Datos
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### Plantilla
```
Vehículos
{d[type].brand}
{d[type+1].brand}
```

##### Resultado
```
Vehículos
Hyundai
Airbus
```