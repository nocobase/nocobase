
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Uso de la función «Impresión de plantillas» para generar un ejemplo de Contrato de Suministro y Compra

En escenarios de cadena de suministro o comercio, a menudo es necesario generar rápidamente un "Contrato de Suministro y Compra" estandarizado y rellenar su contenido dinámicamente con información de **fuentes de datos** como compradores, vendedores y detalles de productos. A continuación, utilizaremos un caso de uso simplificado de "Contrato" como ejemplo para mostrarle cómo configurar y usar la función «Impresión de plantillas» para mapear la información de los datos a los marcadores de posición en las plantillas de contrato, generando así automáticamente el documento de contrato final.

---

## 1. Antecedentes y Resumen de la Estructura de Datos

En nuestro ejemplo, existen aproximadamente las siguientes **colecciones** principales (omitiendo otros campos irrelevantes):

- **parties**: Almacena información sobre unidades o individuos de la Parte A/Parte B, incluyendo nombre, dirección, persona de contacto, teléfono, etc.
- **contracts**: Almacena registros de contratos específicos, incluyendo número de contrato, claves foráneas de comprador/vendedor, información del firmante, fechas de inicio/fin, cuenta bancaria, etc.
- **contract_line_items**: Almacena múltiples ítems bajo el contrato (nombre del producto, especificación, cantidad, precio unitario, fecha de entrega, etc.)

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Dado que el sistema actual solo admite la impresión de registros individuales, haremos clic en "Imprimir" en la página de "Detalles del Contrato". El sistema recuperará automáticamente el registro de `contracts` correspondiente, así como la información asociada de `parties` y otros datos, y los rellenará en documentos de Word o PDF.

## 2. Preparación

### 2.1 Preparación del **plugin**

Tenga en cuenta que nuestro **plugin** de «Impresión de plantillas» es un **plugin** comercial que debe comprarse y activarse antes de poder realizar operaciones de impresión.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Confirmar la activación del plugin:**

En cualquier página, cree un bloque de detalles (por ejemplo, `users`) y verifique si existe una opción de configuración de plantilla correspondiente en la configuración de acciones:

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Creación de **colecciones**

Cree las **colecciones** principales (entidad, contrato e ítems de producto) diseñadas anteriormente (seleccione solo los campos principales).

#### **Colección** de Contratos (`Contracts`)

| Categoría de Campo | Nombre de Visualización del Campo | Nombre del Campo | Interfaz del Campo |
|---------|-------------------|------------|-----------------|
| **Campos PK y FK** | | | |
| | ID | id | Entero |
| | ID Comprador | buyer_id | Entero |
| | ID Vendedor | seller_id | Entero |
| **Campos de Asociación** | | | |
| | Ítems del Contrato | contract_items | Uno a muchos |
| | Comprador (Parte A) | buyer | Muchos a uno |
| | Vendedor (Parte B) | seller | Muchos a uno |
| **Campos Generales** | | | |
| | Número de Contrato | contract_no | Texto de una línea |
| | Fecha de Inicio de Entrega | start_date | Fecha y hora (con zona horaria) |
| | Fecha de Fin de Entrega | end_date | Fecha y hora (con zona horaria) |
| | Porcentaje de Depósito (%) | deposit_ratio | Porcentaje |
| | Días de Pago Después de la Entrega | payment_days_after | Entero |
| | Nombre de Cuenta Bancaria (Beneficiario) | bank_account_name | Texto de una línea |
| | Nombre del Banco | bank_name | Texto de una línea |
| | Número de Cuenta Bancaria (Beneficiario) | bank_account_number | Texto de una línea |
| | Monto Total | total_amount | Número |
| | Códigos de Moneda | currency_codes | Selección única |
| | Porcentaje de Saldo (%) | balance_ratio | Porcentaje |
| | Días de Saldo Después de la Entrega | balance_days_after | Entero |
| | Lugar de Entrega | delivery_place | Texto largo |
| | Nombre del Firmante Parte A | party_a_signatory_name | Texto de una línea |
| | Cargo del Firmante Parte A | party_a_signatory_title | Texto de una línea |
| | Nombre del Firmante Parte B | party_b_signatory_name | Texto de una línea |
| | Cargo del Firmante Parte B | party_b_signatory_title | Texto de una línea |
| **Campos del Sistema** | | | |
| | Creado el | createdAt | Creado el |
| | Creado por | createdBy | Creado por |
| | Última Actualización el | updatedAt | Última actualización el |
| | Última Actualización por | updatedBy | Última actualización por |

#### **Colección** de Partes (`Parties`)

| Categoría de Campo | Nombre de Visualización del Campo | Nombre del Campo | Interfaz del Campo |
|---------|-------------------|------------|-----------------|
| **Campos PK y FK** | | | |
| | ID | id | Entero |
| **Campos Generales** | | | |
| | Nombre de la Parte | party_name | Texto de una línea |
| | Dirección | address | Texto de una línea |
| | Persona de Contacto | contact_person | Texto de una línea |
| | Teléfono de Contacto | contact_phone | Teléfono |
| | Puesto | position | Texto de una línea |
| | Correo Electrónico | email | Correo electrónico |
| | Sitio Web | website | URL |
| **Campos del Sistema** | | | |
| | Creado el | createdAt | Creado el |
| | Creado por | createdBy | Creado por |
| | Última Actualización el | updatedAt | Última actualización el |
| | Última Actualización por | updatedBy | Última actualización por |

#### **Colección** de Ítems de Contrato (`Contract Line Items`)

| Categoría de Campo | Nombre de Visualización del Campo | Nombre del Campo | Interfaz del Campo |
|---------|-------------------|------------|-----------------|
| **Campos PK y FK** | | | |
| | ID | id | Entero |
| | ID Contrato | contract_id | Entero |
| **Campos de Asociación** | | | |
| | Contrato | contract | Muchos a uno |
| **Campos Generales** | | | |
| | Nombre del Producto | product_name | Texto de una línea |
| | Especificación / Modelo | spec | Texto de una línea |
| | Cantidad | quantity | Entero |
| | Precio Unitario | unit_price | Número |
| | Monto Total | total_amount | Número |
| | Fecha de Entrega | delivery_date | Fecha y hora (con zona horaria) |
| | Observación | remark | Texto largo |
| **Campos del Sistema** | | | |
| | Creado el | createdAt | Creado el |
| | Creado por | createdBy | Creado por |
| | Última Actualización el | updatedAt | Última actualización el |
| | Última Actualización por | updatedBy | Última actualización por |

### 2.3 Configuración de la Interfaz

**Introducir datos de ejemplo:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Configure las reglas de vinculación de la siguiente manera para calcular automáticamente el precio total y los pagos pendientes:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Cree un bloque de vista, confirme los datos y habilite la acción de «Impresión de plantillas»:**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Configuración del **plugin** de Impresión de Plantillas

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

Agregue una configuración de plantilla, como «Contrato de Suministro y Compra»:

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

A continuación, vaya a la pestaña de Lista de Campos, donde podrá ver todos los campos del objeto actual. Después de hacer clic en "Copiar", podrá empezar a rellenar la plantilla.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Preparación del Archivo de Contrato

**Archivo de Plantilla de Contrato de Word**

Prepare de antemano la plantilla de contrato (archivo `.docx`), por ejemplo: `SUPPLY AND PURCHASE CONTRACT.docx`

En este ejemplo, le proporcionamos una versión simplificada del «Contrato de Suministro y Compra», que contiene marcadores de posición de ejemplo:

- `{d.contract_no}`: Número de contrato
- `{d.buyer.party_name}`、`{d.seller.party_name}`: Nombres del comprador y del vendedor
- `{d.total_amount}`: Monto total del contrato
- Y otros marcadores de posición como "persona de contacto", "dirección", "teléfono", etc.

A continuación, puede copiar y pegar los campos de su **colección** en Word.

---

## 3. Tutorial de Variables de Plantilla

### 3.1 Relleno de Variables Básicas y Propiedades de Objetos Asociados

**Relleno de campos básicos:**

Por ejemplo, el número de contrato en la parte superior, o el objeto de la entidad firmante del contrato. Simplemente haga clic en copiar y péguelo directamente en el espacio en blanco correspondiente del contrato.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Formato de Datos

#### Formato de Fechas

En las plantillas, a menudo necesitamos dar formato a los campos, especialmente a los campos de fecha. El formato de fecha copiado directamente suele ser largo (por ejemplo, `Wed Jan 01 2025 00:00:00 GMT`), y es necesario formatearlo para mostrar el estilo que deseamos.

Para los campos de fecha, puede utilizar la función `formatD()` para especificar el formato de salida:

```
{nombre_del_campo:formatD(estilo_de_formato)}
```

**Ejemplo:**

Por ejemplo, si el campo original que copiamos es `{d.created_at}`, y necesitamos formatear la fecha al estilo `2025-01-01`, entonces modifique este campo para que sea:

```
{d.created_at:formatD(YYYY-MM-DD)}  // Salida: 2025-01-01
```

**Estilos comunes de formato de fecha:**

- `YYYY` - Año (cuatro dígitos)
- `MM` - Mes (dos dígitos)
- `DD` - Día (dos dígitos)
- `HH` - Hora (formato de 24 horas)
- `mm` - Minutos
- `ss` - Segundos

**Ejemplo 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Salida: 2025-01-01 14:30:00
```

#### Formato de Números

Supongamos que hay un campo de monto, como `{d.total_amount}` en el contrato. Podemos usar la función `formatN()` para formatear números, especificando los decimales y el separador de miles.

**Sintaxis:**

```
{nombre_del_campo:formatN(decimales, separador_de_miles)}
```

- **decimales**: Puede especificar cuántos decimales desea mantener. Por ejemplo, `2` significa dos decimales.
- **separador_de_miles**: Especifique si desea usar el separador de miles, generalmente `true` o `false`.

**Ejemplo 1: Formatear un monto con separador de miles y dos decimales**

```
{d.amount:formatN(2, true)}  // Salida: 1.234,56
```

Esto formateará `d.amount` a dos decimales y agregará un separador de miles.

**Ejemplo 2: Formatear un monto a un número entero sin decimales**

```
{d.amount:formatN(0, true)}  // Salida: 1.235
```

Esto formateará `d.amount` a un número entero y agregará un separador de miles.

**Ejemplo 3: Formatear un monto con dos decimales pero sin separador de miles**

```
{d.amount:formatN(2, false)}  // Salida: 1234,56
```

Aquí se deshabilita el separador de miles y solo se mantienen dos decimales.

**Otras necesidades de formato de monto:**

- **Símbolo de moneda**: Carbone no proporciona directamente funciones de formato de símbolo de moneda, pero puede agregar símbolos de moneda directamente en los datos o en las plantillas. Por ejemplo:
  ```
  {d.amount:formatN(2, true)} EUR  // Salida: 1.234,56 EUR
  ```

#### Formato de Cadenas de Texto

Para los campos de cadena de texto, puede usar `:upperCase` para especificar el formato del texto, como la conversión a mayúsculas o minúsculas.

**Sintaxis:**

```
{nombre_del_campo:upperCase:otros_comandos}
```

**Métodos de conversión comunes:**

- `upperCase` - Convertir a todo mayúsculas
- `lowerCase` - Convertir a todo minúsculas
- `upperCase:ucFirst` - Poner la primera letra en mayúscula

**Ejemplo:**

```
{d.party_a_signatory_name:upperCase}  // Salida: JOHN DOE
```

### 3.3 Impresión en Bucle

#### Cómo imprimir listas de objetos secundarios (como detalles de productos)

Cuando necesitamos imprimir una tabla que contiene múltiples sub-ítems (por ejemplo, detalles de productos), normalmente necesitamos utilizar la impresión en bucle. De esta manera, el sistema generará una fila de contenido para cada ítem de la lista hasta que se hayan recorrido todos los ítems.

Supongamos que tenemos una lista de productos (por ejemplo, `contract_items`), que contiene múltiples objetos de producto. Cada objeto de producto tiene varios atributos, como nombre del producto, especificación, cantidad, precio unitario, monto total y observaciones.

**Paso 1: Rellenar los campos en la primera fila de la tabla**

Primero, en la primera fila de la tabla (no en el encabezado), copie y rellene directamente las variables de la plantilla. Estas variables serán reemplazadas por los datos correspondientes y se mostrarán en la salida.

Por ejemplo, la primera fila de la tabla es la siguiente:

| Nombre del Producto | Especificación / Modelo | Cantidad | Precio Unitario | Monto Total | Observación |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Aquí, `d.contract_items[i]` representa el i-ésimo ítem en la lista de productos, e `i` es un índice que representa el orden del producto actual.

**Paso 2: Modificar el índice en la segunda fila**

A continuación, en la segunda fila de la tabla, modificaremos el índice del campo a `i+1` y rellenaremos solo el primer atributo. Esto se debe a que, durante la impresión en bucle, necesitamos recuperar el siguiente ítem de datos de la lista y mostrarlo en la siguiente fila.

Por ejemplo, la segunda fila se rellena de la siguiente manera:
| Nombre del Producto | Especificación / Modelo | Cantidad | Precio Unitario | Monto Total | Observación |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |


En este ejemplo, cambiamos `[i]` a `[i+1]`, lo que nos permite obtener los datos del siguiente producto en la lista.

**Paso 3: Impresión en bucle automática durante la renderización de la plantilla**

Cuando el sistema procesa esta plantilla, operará según la siguiente lógica:

1. La primera fila se rellenará de acuerdo con los campos que haya configurado en la plantilla.
2. Luego, el sistema eliminará automáticamente la segunda fila y comenzará a extraer datos de `d.contract_items`, rellenando cada fila en bucle según el formato de la tabla hasta que se hayan impreso todos los detalles del producto.

El valor de `i` en cada fila se incrementará, asegurando que cada fila muestre información diferente del producto.

---

## 4. Cargar y Configurar la Plantilla de Contrato

### 4.1 Cargar Plantilla

1. Haga clic en el botón «Agregar plantilla» e introduzca el nombre de la plantilla, por ejemplo, "Plantilla de Contrato de Suministro y Compra".
2. Cargue el [archivo de contrato de Word (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx) preparado, que ya contiene todos los marcadores de posición.

![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Una vez completado, el sistema listará la plantilla en la lista de plantillas disponibles para su uso futuro.
4. Haga clic en "Usar" para activar esta plantilla.

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

En este punto, salga de la ventana emergente actual y haga clic en "Descargar plantilla" para obtener la plantilla completa generada.

**Consejos:**

- Si la plantilla utiliza formatos `.doc` u otros, es posible que deba convertirla a `.docx`, dependiendo de la compatibilidad del **plugin**.
- En los archivos de Word, tenga cuidado de no dividir los marcadores de posición en varios párrafos o cuadros de texto para evitar errores de renderización.

---

¡Le deseamos un uso exitoso! Con la función «Impresión de plantillas», podrá ahorrar enormemente el trabajo repetitivo en la gestión de contratos, evitar errores de copiar y pegar manuales, y lograr una salida de contratos estandarizada y automatizada.