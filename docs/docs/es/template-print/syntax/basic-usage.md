:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

## Uso Básico

El **plugin** de impresión de plantillas ofrece varias sintaxis para insertar datos dinámicos y estructuras lógicas de forma flexible en sus plantillas. A continuación, encontrará explicaciones detalladas de la sintaxis y ejemplos de uso.

### Reemplazo Básico

Utilice marcadores de posición con el formato `{d.xxx}` para reemplazar datos. Por ejemplo:

- `{d.title}`: Lee el campo `title` del conjunto de datos.
- `{d.date}`: Lee el campo `date` del conjunto de datos.

**Ejemplo**:

Contenido de la plantilla:
```
Estimado/a cliente,

Gracias por adquirir nuestro producto: {d.productName}.
Número de pedido: {d.orderId}
Fecha del pedido: {d.orderDate}

¡Esperamos que disfrute su experiencia!
```

Conjunto de datos:
```json
{
  "productName": "Reloj inteligente",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Resultado renderizado:
```
Estimado/a cliente,

Gracias por adquirir nuestro producto: Reloj inteligente.
Número de pedido: A123456789
Fecha del pedido: 2025-01-01

¡Esperamos que disfrute su experiencia!
```

### Acceso a Subobjetos

Si el conjunto de datos contiene subobjetos, puede acceder a sus propiedades utilizando la notación de punto.

**Sintaxis**: `{d.parent.child}`

**Ejemplo**:

Conjunto de datos:
```json
{
  "customer": {
    "name": "Li Lei",
    "contact": {
      "email": "lilei@example.com",
      "phone": "13800138000"
    }
  }
}
```

Contenido de la plantilla:
```
Nombre del cliente: {d.customer.name}
Dirección de correo electrónico: {d.customer.contact.email}
Número de teléfono: {d.customer.contact.phone}
```

Resultado renderizado:
```
Nombre del cliente: Li Lei
Dirección de correo electrónico: lilei@example.com
Número de teléfono: 13800138000
```

### Acceso a Arrays

Si el conjunto de datos contiene arrays, puede utilizar la palabra clave reservada `i` para acceder a los elementos del array.

**Sintaxis**: `{d.arrayName[i].field}`

**Ejemplo**:

Conjunto de datos:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Contenido de la plantilla:
```
El apellido del primer empleado es {d.staffs[i=0].lastname} y su nombre es {d.staffs[i=0].firstname}
```

Resultado renderizado:
```
El apellido del primer empleado es Anderson y su nombre es James
```