# Uso de variables de plantilla en Markdown

¡Bienvenido a este tutorial! En esta sección aprenderemos paso a paso cómo utilizar Markdown junto con el motor de plantillas Handlebars para mostrar contenido dinámico. En el capítulo anterior "Trucos del bloque Markdown" ya ha visto la sintaxis básica, los métodos de creación y la inserción de variables; ahora exploraremos en profundidad los usos avanzados de las variables de plantilla.

## 1 Introducción al motor de plantillas [Handlebars](https://docs-cn.nocobase.com/handbook/template-handlebars)

Tras crear un bloque Markdown, en la configuración de la esquina superior derecha verá una opción "Motor de plantillas", cuyo valor por defecto es Handlebars. Handlebars permite mostrar dinámicamente el contenido de la página según condiciones, lo que hace que Markdown también pueda responder a los cambios.

![Esquema del motor de plantillas](https://static-docs.nocobase.com/20250304011925.png)

### 1.1 La función de Handlebars

Aunque Markdown solo admite contenido estático de forma nativa, con Handlebars puede cambiar dinámicamente los textos y estilos según condiciones (como un estado, un número o una opción). De este modo, incluso ante escenarios cambiantes del negocio, su página siempre mostrará la información correcta.

## 2 Escenarios de aplicación reales

A continuación veremos varios escenarios prácticos e implementaremos paso a paso sus funciones.

### 2.1 Manejar el estado de un pedido

En una demo en línea, normalmente necesitamos mostrar mensajes diferentes según el estado del pedido. Suponga que en su tabla de pedidos existe un campo de estado con los siguientes valores:

![Campo de estado del pedido](https://static-docs.nocobase.com/20250304091420.png)

A continuación se muestran los contenidos correspondientes a los 4 estados:


| Etiqueta            | Valor | Contenido a mostrar                                                                            |
| ------------------- | ----- | ---------------------------------------------------------------------------------------------- |
| Pending Approval    | 1     | El pedido se ha enviado y está pendiente de revisión interna.                                  |
| Pending Payment     | 2     | A la espera del pago del cliente. Por favor, mantenga el pedido bajo observación.              |
| Paid                | 3     | El pago ha sido confirmado, proceda a las gestiones siguientes. El asesor asignado se pondrá en contacto con el cliente en menos de 1 hora. |
| Rejected            | 4     | La aprobación del pedido no ha sido concedida. Si es necesario, revíselo y vuelva a iniciarlo. |

En la página podemos capturar el valor del estado del pedido y mostrar dinámicamente diferentes mensajes. A continuación explicaremos en detalle cómo implementarlo con la sintaxis if, else y else if.

#### 2.1.1 Sintaxis if

Con la condición if podemos mostrar el contenido si se cumple la condición. Por ejemplo:

```
{{#if condición}}
  <p>Resultado mostrado</p>
{{/if}}
```

La "condición" debe usar la sintaxis de Handlebars (eq, gt, lt, etc.). Pruebe este sencillo ejemplo:

```
{{#if (eq 1 1)}}
  <p>Resultado mostrado: 1 = 1</p>
{{/if}}
```

Vea el resultado en las siguientes imágenes:

![Ejemplo if 1](https://static-docs.nocobase.com/20250305115416.png)
![Ejemplo if 2](https://static-docs.nocobase.com/20250305115434.png)

#### 2.1.2 Sintaxis else

Cuando la condición no se cumple, podemos especificar un contenido alternativo con else. Por ejemplo:

```
{{#if (eq 1 2)}}
  <p>Resultado mostrado: 1 = 2</p>
{{else}}
  <p>Resultado mostrado: 1 ≠ 2</p>
{{/if}}
```

Resultado:

![Ejemplo else](https://static-docs.nocobase.com/20250305115524.png)

#### 2.1.3 Evaluación con varias condiciones

Si necesita evaluar varias condiciones, puede usar else if. Código de ejemplo:

```
{{#if (eq 1 7)}}
  <p>Resultado mostrado: 1 = 7</p>
{{else if (eq 1 5)}}
  <p>Resultado mostrado: 1 = 5</p>
{{else if (eq 1 4)}}
  <p>Resultado mostrado: 1 = 4</p>
{{else}}
  <p>Resultado mostrado: 1 ≠ 7 ≠ 5 ≠ 3</p>
{{/if}}
```

Imagen del resultado:

![Ejemplo de varias condiciones](https://static-docs.nocobase.com/20250305115719.png)

### 2.2 Demostración del resultado

Una vez configurado el estado del pedido, la página cambiará dinámicamente la visualización según el estado. Vea el siguiente ejemplo:

![Efecto dinámico del estado del pedido](https://static-docs.nocobase.com/202503040942-handlebar1.gif)

El código de la página es el siguiente:

```
{{#if order.status}}
  <div>
    {{#if (eq order.status "1")}}
      <span style="color: orange;">⏳ Pending Approval</span>
      <p>El pedido se ha enviado y está pendiente de revisión interna.</p>
    {{else if (eq order.status "2")}}
      <span style="color: #1890ff;">💳 Pending Payment</span>
      <p>A la espera del pago del cliente. Por favor, mantenga el pedido bajo observación.</p>
    {{else if (eq order.status "3")}}
      <span style="color: #52c41a;">✔ Paid</span>
      <p>El pago ha sido confirmado, proceda a las gestiones siguientes. El asesor asignado se pondrá en contacto con el cliente en menos de 1 hora.</p>
    {{else if (eq order.status "4")}}
      <span style="color: #f5222d;">✖ Rejected</span>
      <p>La aprobación del pedido no ha sido concedida. Si es necesario, revíselo y vuelva a iniciarlo.</p>
    {{/if}}
  </div>
{{else}}
  <p class="empty-state">No hay pedidos pendientes.</p>
{{/if}}
```

Pruebe a cambiar el estado del pedido y compruebe si el contenido de la página se actualiza, lo que verifica si el código es correcto.

### 2.3 Mostrar los detalles del pedido

Además de mostrar el estado del pedido, los detalles del pedido (lista de productos) también son una necesidad habitual. A continuación, usaremos la sintaxis each para implementarlo.

#### 2.3.1 Introducción a la sintaxis each

each se utiliza para iterar sobre listas. Por ejemplo, para el array [1,2,3] podría escribir:

```
{{#each lista}}
  <p>Resultado mostrado: {{this}}</p>
  <p>Índice: {{@index}}</p>
{{/each}}
```

Dentro del bucle, {{this}} representa el elemento actual y {{@index}} el índice actual.

#### 2.3.2 Ejemplo de detalles de productos

Si necesita mostrar todos los productos de un pedido, puede usar el siguiente código:

```
{{#each $nRecord.order_items}}
    <p>{{@index}}</p>
    <p>{{this.id}}</p>
    <p>{{this.price}}</p>
    <p>{{this.quantity}}</p>
    <p>{{this.product.name}}</p>
---
{{/each}}
```

Si la página no muestra los datos, asegúrese de que el campo de detalles del pedido esté correctamente expuesto; de lo contrario el sistema considerará que estos datos son redundantes y no los consultará.
![20250305122543_handlebar_each](https://static-docs.nocobase.com/20250305122543_handlebar_each.gif)

Es posible que el nombre del objeto producto (`product.name`) no aparezca; por la misma razón anterior, hay que mostrar también el objeto producto.
![20250305122543_each2](https://static-docs.nocobase.com/20250305122543_each2.gif)

Una vez visible, podemos ocultar este campo relacionado mediante una regla de enlace.
![20250305122543_hidden_each](https://static-docs.nocobase.com/20250305122543_hidden_each.gif)

### 2.4 Producto final: lista de productos del pedido

Tras seguir los pasos anteriores, dispondrá de una plantilla completa para mostrar la lista de productos del pedido. Consulte el siguiente código:

```
### Lista de productos del pedido

{{#if $nRecord.order_items}}
  <div class="cart-summary">Total: {{$nRecord.order_items.length}} productos, importe total: ¥{{$nRecord.total}}</div>
  
  <table>
    <thead>
      <tr>
        <th>N.º</th>
        <th>Nombre del producto</th>
        <th>Precio unitario</th>
        <th>Cantidad</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      {{#each $nRecord.order_items}}
        <tr style="{{#if this.out_of_stock}}color: red;{{/if}}">
          <td>{{@index}}</td>
          <td>{{this.product.name}}</td>
          <td>¥{{this.price}}</td>
          <td>{{this.quantity}}</td>
          <td>¥{{multiply this.price this.quantity}}</td>
          <td>
            {{#if this.out_of_stock}}
              <span>Sin stock</span>
            {{else if this.low_stock}}
              <span style="color:orange;">Stock bajo</span>
            {{/if}}
          </td>
        </tr>
      {{/each}}
    </tbody>
  </table>
{{else}}
  <p>El pedido está vacío</p>
{{/if}}
```

Tras ejecutarlo verá un efecto como el siguiente:

![Lista de productos del pedido](https://static-docs.nocobase.com/20250305124125.png)

Para ilustrar mejor la flexibilidad de Handlebars, en los detalles del pedido hemos añadido los campos "Sin stock" (out_of_stock) y "Stock bajo" (low_stock):

- Cuando out_of_stock es true, se muestra "Sin stock" y la línea del producto se vuelve roja.
- Cuando low_stock es true, a la derecha aparece "Stock bajo" en color naranja.

![Efectos adicionales: sin stock y stock bajo](https://static-docs.nocobase.com/20250305130258.png)

## 3 Resumen y recomendaciones

Mediante esta explicación, ha aprendido a usar Handlebars para renderizar dinámicamente plantillas Markdown, incluyendo las sintaxis principales if/else y each. En el desarrollo real, para lógicas más complejas, le recomendamos combinar reglas de enlace, campos calculados, workflows o nodos script para mejorar la flexibilidad y la escalabilidad.

Esperamos que practique estas técnicas y las aplique con flexibilidad en sus proyectos. ¡Siga esforzándose y siga descubriendo más posibilidades!

---

Si encuentra algún problema durante el proceso, le invitamos a participar en la [Comunidad de NocoBase](https://forum.nocobase.com) o consultar la [documentación oficial](https://docs-cn.nocobase.com). Esperamos que esta guía le ayude a implementar con éxito la revisión de registro de usuarios según sus necesidades reales y a ampliarla con flexibilidad. ¡Le deseamos éxito en su uso y en su proyecto!
