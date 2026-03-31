:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

## Problemas Comunes y Soluciones

### 1. Las columnas y celdas vacías en las plantillas de Excel desaparecen en los resultados renderizados

**Descripción del problema**: En las plantillas de Excel, si una celda no tiene contenido o estilo, es posible que se elimine durante el renderizado, lo que provoca la ausencia de esa celda en el documento final.

**Soluciones**:

- **Rellenar con color de fondo**: Aplique un color de fondo a las celdas vacías en el área objetivo para asegurar que permanezcan visibles durante el proceso de renderizado.
- **Insertar espacios**: Inserte un carácter de espacio en las celdas vacías para mantener la estructura de la celda, incluso sin contenido real.
- **Establecer bordes**: Agregue estilos de borde a la tabla para mejorar los límites de las celdas y evitar que desaparezcan durante el renderizado.

**Ejemplo**:

En la plantilla de Excel, configure un fondo gris claro para todas las celdas objetivo e inserte espacios en las celdas vacías.

### 2. Las celdas combinadas no son válidas en la salida

**Descripción del problema**: Al usar la funcionalidad de bucle para generar tablas, las celdas combinadas en la plantilla pueden causar resultados de renderizado anormales, como la pérdida del efecto de combinación o la desalineación de los datos.

**Soluciones**:

- **Evite usar celdas combinadas**: Intente evitar el uso de celdas combinadas en tablas generadas por bucles para asegurar un renderizado de datos correcto.
- **Usar centrar en la selección**: Si necesita que el texto esté centrado horizontalmente en varias celdas, utilice la función "Centrar en la selección" en lugar de combinar celdas.
- **Limitar las posiciones de las celdas combinadas**: Si es necesario usar celdas combinadas, combínelas solo encima o a la derecha de la tabla, evitando combinarlas debajo o a la izquierda para prevenir la pérdida de los efectos de combinación durante el renderizado.

### 3. El contenido debajo del área de renderizado en bucle causa desorden de formato

**Descripción del problema**: En las plantillas de Excel, si hay otro contenido (por ejemplo, un resumen de pedido, notas) debajo de un área de bucle que crece dinámicamente según los elementos de datos (por ejemplo, detalles del pedido), durante el renderizado, las filas de datos generadas por el bucle se expandirán hacia abajo, sobrescribiendo o empujando directamente el contenido estático inferior, lo que provocará un desorden de formato y una superposición de contenido en el documento final.

**Soluciones**:

  * **Ajustar el diseño, colocar el área de bucle en la parte inferior**: Este es el método más recomendado. Coloque el área de la tabla que necesita renderizado en bucle en la parte inferior de toda la hoja de cálculo. Mueva toda la información que originalmente estaba debajo (resumen, firmas, etc.) a la parte superior del área de bucle. De esta manera, los datos del bucle pueden expandirse libremente hacia abajo sin afectar a ningún otro elemento.
  * **Reservar suficientes filas en blanco**: Si el contenido debe colocarse debajo del área de bucle, puede estimar el número máximo de filas que el bucle podría generar e insertar manualmente suficientes filas en blanco como búfer entre el área de bucle y el contenido inferior. Sin embargo, este método tiene riesgos: si los datos reales exceden las filas estimadas, el problema volverá a ocurrir.
  * **Usar plantillas de Word**: Si los requisitos de diseño son complejos y no se pueden resolver ajustando la estructura de Excel, considere usar documentos de Word como plantillas. Las tablas en Word empujan automáticamente el contenido inferior cuando aumentan las filas, sin problemas de superposición de contenido, lo que las hace más adecuadas para generar este tipo de documentos dinámicos.

**Ejemplo**:

**Enfoque incorrecto**: Colocar la información del "Resumen del pedido" inmediatamente debajo de la tabla de "Detalles del pedido" en bucle.
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Enfoque correcto 1 (Ajustar diseño)**: Mueva la información del "Resumen del pedido" encima de la tabla de "Detalles del pedido", haciendo que el área de bucle sea el elemento inferior de la página.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Enfoque correcto 2 (Reservar filas en blanco)**: Reserve muchas filas en blanco entre "Detalles del pedido" y "Resumen del pedido" para asegurar que el contenido del bucle tenga suficiente espacio de expansión.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Enfoque correcto 3**: Utilice plantillas de Word.

### 4. Aparecen mensajes de error durante el renderizado de la plantilla

**Descripción del problema**: Durante el proceso de renderizado de la plantilla, el sistema muestra mensajes de error, lo que provoca que el renderizado falle.

**Posibles causas**:

- **Errores de marcador de posición**: Los nombres de los marcadores de posición no coinciden con los campos del conjunto de datos o tienen errores de sintaxis.
- **Datos faltantes**: El conjunto de datos carece de campos referenciados en la plantilla.
- **Uso incorrecto del formateador**: Los parámetros del formateador son incorrectos o los tipos de formato no son compatibles.

**Soluciones**:

- **Verificar marcadores de posición**: Asegúrese de que los nombres de los marcadores de posición en la plantilla coincidan con los nombres de los campos en el conjunto de datos y que la sintaxis sea correcta.
- **Validar conjunto de datos**: Confirme que el conjunto de datos contiene todos los campos referenciados en la plantilla con los formatos de datos adecuados.
- **Ajustar formateadores**: Verifique los métodos de uso del formateador, asegúrese de que los parámetros sean correctos y utilice tipos de formato compatibles.

**Ejemplo**:

**Plantilla incorrecta**:
```
Order ID: {d.orderId}
Order Date: {d.orderDate:format('YYYY/MM/DD')}
Total Amount: {d.totalAmount:format('0.00')}
```

**Conjunto de datos**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Falta el campo totalAmount
}
```

**Solución**: Agregue el campo `totalAmount` al conjunto de datos o elimine la referencia a `totalAmount` de la plantilla.