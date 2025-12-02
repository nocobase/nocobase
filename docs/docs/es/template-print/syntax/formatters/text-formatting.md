:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

### Formato de Texto

Esta sección le presenta varios formateadores para datos de texto. A continuación, exploraremos la sintaxis, los ejemplos y los resultados de cada uno.

#### 1. :lowerCase

##### Explicación de la sintaxis
Convierte todas las letras a minúsculas.

##### Ejemplo
```
'My Car':lowerCase()   // Salida: "my car"
'my car':lowerCase()   // Salida: "my car"
null:lowerCase()       // Salida: null
1203:lowerCase()       // Salida: 1203
```

##### Resultado
La salida de cada ejemplo se muestra en los comentarios.


#### 2. :upperCase

##### Explicación de la sintaxis
Convierte todas las letras a mayúsculas.

##### Ejemplo
```
'My Car':upperCase()   // Salida: "MY CAR"
'my car':upperCase()   // Salida: "MY CAR"
null:upperCase()       // Salida: null
1203:upperCase()       // Salida: 1203
```

##### Resultado
La salida de cada ejemplo se muestra en los comentarios.


#### 3. :ucFirst

##### Explicación de la sintaxis
Convierte solo la primera letra de la cadena a mayúscula, dejando el resto sin cambios.

##### Ejemplo
```
'My Car':ucFirst()     // Salida: "My Car"
'my car':ucFirst()     // Salida: "My car"
null:ucFirst()         // Salida: null
undefined:ucFirst()    // Salida: undefined
1203:ucFirst()         // Salida: 1203
```

##### Resultado
La salida se describe en los comentarios.


#### 4. :ucWords

##### Explicación de la sintaxis
Convierte la primera letra de cada palabra en la cadena a mayúscula.

##### Ejemplo
```
'my car':ucWords()     // Salida: "My Car"
'My cAR':ucWords()     // Salida: "My CAR"
null:ucWords()         // Salida: null
undefined:ucWords()    // Salida: undefined
1203:ucWords()         // Salida: 1203
```

##### Resultado
La salida es la que se muestra en los ejemplos.


#### 5. :print(message)

##### Explicación de la sintaxis
Siempre devuelve el mensaje especificado, sin importar los datos originales, lo que lo hace útil como formateador de respaldo.
Parámetro:
- **message:** El texto a imprimir.

##### Ejemplo
```
'My Car':print('hello!')   // Salida: "hello!"
'my car':print('hello!')   // Salida: "hello!"
null:print('hello!')       // Salida: "hello!"
1203:print('hello!')       // Salida: "hello!"
```

##### Resultado
En todos los casos, devuelve la cadena "hello!" especificada.


#### 6. :printJSON

##### Explicación de la sintaxis
Convierte un objeto o un array en una cadena con formato JSON.

##### Ejemplo
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Salida: "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Salida: ""my car""
```

##### Resultado
La salida es la cadena con formato JSON de los datos proporcionados.


#### 7. :unaccent

##### Explicación de la sintaxis
Elimina los signos diacríticos del texto, convirtiéndolo a un formato sin acentos.

##### Ejemplo
```
'crÃ¨me brulÃ©e':unaccent()   // Salida: "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Salida: "CREME BRULEE"
'Ãªtre':unaccent()           // Salida: "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Salida: "euieea"
```

##### Resultado
Todos los ejemplos muestran el texto sin acentos.


#### 8. :convCRLF

##### Explicación de la sintaxis
Convierte los caracteres de retorno de carro y nueva línea (`\r\n` o `\n`) en etiquetas de salto de línea específicas del documento. Esto es útil para formatos como DOCX, PPTX, ODT, ODP y ODS.
**Nota:** Cuando se utiliza `:html` antes del formateador `:convCRLF`, `\r\n` se convierte en una etiqueta `<br>`.

##### Ejemplo
```
// Para formato ODT:
'my blue 
 car':convCRLF()    // Salida: "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // Salida: "my blue <text:line-break/> car"

// Para formato DOCX:
'my blue 
 car':convCRLF()    // Salida: "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // Salida: "my blue </w:t><w:br/><w:t> car"
```

##### Resultado
La salida muestra los marcadores de salto de línea apropiados para el formato de documento de destino.


#### 9. :substr(begin, end, wordMode)

##### Explicación de la sintaxis
Realiza operaciones de subcadena en una cadena, comenzando en el índice `begin` (basado en 0) y terminando justo antes del índice `end`.
Un parámetro opcional `wordMode` (booleano o `last`) controla si se debe evitar romper una palabra por la mitad.

##### Ejemplo
```
'foobar':substr(0, 3)            // Salida: "foo"
'foobar':substr(1)               // Salida: "oobar"
'foobar':substr(-2)              // Salida: "ar"
'foobar':substr(2, -1)           // Salida: "oba"
'abcd efg hijklm':substr(0, 11, true)  // Salida: "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Salida: "abcd efg "
```

##### Resultado
La salida es la subcadena extraída según los parámetros.


#### 10. :split(delimiter)

##### Explicación de la sintaxis
Divide una cadena en un array utilizando el delimitador especificado.
Parámetro:
- **delimiter:** La cadena delimitadora.

##### Ejemplo
```
'abcdefc12':split('c')    // Salida: ["ab", "def", "12"]
1222.1:split('.')         // Salida: ["1222", "1"]
'ab/cd/ef':split('/')      // Salida: ["ab", "cd", "ef"]
```

##### Resultado
El resultado del ejemplo es un array dividido por el delimitador dado.


#### 11. :padl(targetLength, padString)

##### Explicación de la sintaxis
Rellena el lado izquierdo de una cadena con un carácter especificado hasta que la longitud final de la cadena alcance `targetLength`.
Si la longitud objetivo es menor que la longitud de la cadena original, se devuelve la cadena original.
Parámetros:
- **targetLength:** La longitud total deseada.
- **padString:** La cadena utilizada para el relleno (el valor predeterminado es un espacio).

##### Ejemplo
```
'abc':padl(10)              // Salida: "       abc"
'abc':padl(10, 'foo')       // Salida: "foofoofabc"
'abc':padl(6, '123465')     // Salida: "123abc"
'abc':padl(8, '0')          // Salida: "00000abc"
'abc':padl(1)               // Salida: "abc"
```

##### Resultado
Cada ejemplo muestra la cadena rellenada por la izquierda.


#### 12. :padr(targetLength, padString)

##### Explicación de la sintaxis
Rellena el lado derecho de una cadena con un carácter especificado hasta que la longitud final de la cadena alcance `targetLength`.
Los parámetros son los mismos que para `:padl`.

##### Ejemplo
```
'abc':padr(10)              // Salida: "abc       "
'abc':padr(10, 'foo')       // Salida: "abcfoofoof"
'abc':padr(6, '123465')     // Salida: "abc123"
'abc':padr(8, '0')          // Salida: "abc00000"
'abc':padr(1)               // Salida: "abc"
```

##### Resultado
La salida muestra la cadena rellenada por la derecha.


#### 13. :ellipsis(maximum)

##### Explicación de la sintaxis
Si el texto excede el número de caracteres especificado, añade puntos suspensivos ("...") al final.
Parámetro:
- **maximum:** El número máximo de caracteres permitidos.

##### Ejemplo
```
'abcdef':ellipsis(3)      // Salida: "abc..."
'abcdef':ellipsis(6)      // Salida: "abcdef"
'abcdef':ellipsis(10)     // Salida: "abcdef"
```

##### Resultado
Los ejemplos muestran el texto truncado y con puntos suspensivos añadidos si es necesario.


#### 14. :prepend(textToPrepend)

##### Explicación de la sintaxis
Añade el texto especificado al principio de la cadena.
Parámetro:
- **textToPrepend:** El texto de prefijo.

##### Ejemplo
```
'abcdef':prepend('123')     // Salida: "123abcdef"
```

##### Resultado
La salida muestra el texto con el prefijo especificado añadido.


#### 15. :append(textToAppend)

##### Explicación de la sintaxis
Añade el texto especificado al final de la cadena.
Parámetro:
- **textToAppend:** El texto de sufijo.

##### Ejemplo
```
'abcdef':append('123')      // Salida: "abcdef123"
```

##### Resultado
La salida muestra el texto con el sufijo especificado añadido.


#### 16. :replace(oldText, newText)

##### Explicación de la sintaxis
Reemplaza todas las ocurrencias de `oldText` en el texto con `newText`.
Parámetros:
- **oldText:** El texto a reemplazar.
- **newText:** El nuevo texto para reemplazar.
**Nota:** Si `newText` es `null`, indica que el texto coincidente debe eliminarse.

##### Ejemplo
```
'abcdef abcde':replace('cd', 'OK')    // Salida: "abOKef abOKe"
'abcdef abcde':replace('cd')          // Salida: "abef abe"
'abcdef abcde':replace('cd', null)      // Salida: "abef abe"
'abcdef abcde':replace('cd', 1000)      // Salida: "ab1000ef ab1000e"
```

##### Resultado
La salida es el texto después de reemplazar los segmentos especificados.


#### 17. :len

##### Explicación de la sintaxis
Devuelve la longitud de una cadena o un array.

##### Ejemplo
```
'Hello World':len()     // Salida: 11
'':len()                // Salida: 0
[1,2,3,4,5]:len()       // Salida: 5
[1,'Hello']:len()       // Salida: 2
```

##### Resultado
Devuelve la longitud correspondiente como un número.


#### 18. :t

##### Explicación de la sintaxis
Traduce el texto utilizando un diccionario de traducción.
Los ejemplos y resultados dependen de la configuración real del diccionario de traducción.


#### 19. :preserveCharRef

##### Explicación de la sintaxis
Por defecto, se eliminan ciertos caracteres no válidos de XML (como `&`, `>`, `<`, etc.). Este formateador conserva las referencias de caracteres (por ejemplo, `&#xa7;` permanece sin cambios) y es adecuado para escenarios específicos de generación de XML.
Los ejemplos y resultados dependen del caso de uso específico.