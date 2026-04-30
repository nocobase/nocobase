# Trucos del bloque Markdown

El bloque Markdown es uno de los bloques más utilizados y potentes. Va desde simples avisos de texto ligero a estilos HTML básicos, e incluso puede asumir lógica de negocio importante: es muy versátil y flexible.

## I. Funciones básicas del bloque Markdown

Gracias a su flexibilidad, su exposición y su capacidad para modificarse en cualquier momento, el bloque Markdown se utiliza con frecuencia para mostrar avisos del sistema. Ya sean módulos de negocio, funcionalidades, bloques o campos, podemos pegarles, como si fueran post-its, los pequeños avisos que nos resulten útiles.

Antes de utilizar el bloque Markdown, le recomendamos familiarizarse con el formato y la sintaxis de Markdown. Puede consultar el [ejemplo de Vditor](https://docs.nocobase.com/api/field/markdown-vditor).

> Atención: el bloque Markdown en la página es relativamente ligero, por lo que algunas funciones (como las fórmulas matemáticas, los mapas mentales, etc.) no se renderizan por el momento. Sin embargo, podemos lograrlo con HTML, y el sistema también ofrece el componente de campo Vditor que le invitamos a probar.

### 1.1 Ejemplos de página

Podemos observar el uso de Markdown en las páginas de la "Demo en línea" del sistema; en concreto, en la página principal, en la página de pedidos y en "Más ejemplos".

Por ejemplo, las advertencias y avisos de la página principal:
![20250227085425](https://static-docs.nocobase.com/20250227085425.png)

La lógica de cálculo del módulo de pedidos:
![20250227085536](https://static-docs.nocobase.com/20250227085536.png)

Las guías e imágenes en "Más ejemplos":
![20250227085730](https://static-docs.nocobase.com/20250227085730.png)

Cambiando al modo de edición podemos modificar el contenido Markdown en cualquier momento y observar los cambios en la página.
![20250227085855](https://static-docs.nocobase.com/20250227085855.png)

### 1.2 Crear un bloque Markdown

Podemos crear bloques Markdown de forma flexible en páginas, ventanas emergentes y formularios.

#### Formas de creación

- **Crear en una ventana emergente o página:**

  ![Bloque Markdown en ventana emergente/página](https://static-docs.nocobase.com/20250227091156.png)
- **Crear dentro de un bloque de formulario:**

  ![Bloque Markdown en formulario](https://static-docs.nocobase.com/20250227091309.png)

#### Ejemplos de uso

Mediante la sintaxis Markdown, escribir `---` simula una línea horizontal de separación de grupos, lo que produce un efecto sencillo de separación de contenidos, como se muestra a continuación:

![Ejemplo de separación 1](https://static-docs.nocobase.com/20250227092156.png)
![Ejemplo de separación 2](https://static-docs.nocobase.com/20250227092236.png)

---

## II. Visualización personalizada de contenidos

Otra gran ventaja del bloque Markdown es que admite la inserción de variables del sistema, lo que permite generar títulos y avisos personalizados, garantizando que cada usuario vea información única en sus propios formularios.

![Personalización 1](https://static-docs.nocobase.com/20250227092400.png)
![Personalización 2](https://static-docs.nocobase.com/20250227092430.png)

Además, también es posible combinar datos del formulario para realizar una composición sencilla del contenido, como en los siguientes ejemplos:

**Ejemplo de título destacado:**

```markdown
# #{{$nRecord.id}} {{$nPopupRecord.task_name}}

---
```

![Efecto de título destacado](https://static-docs.nocobase.com/20250227164055.png)

**Ejemplo de separación centrada:**

![Efecto de campo centrado](https://static-docs.nocobase.com/20250227164456.png)

## III. Inserción de contenidos enriquecidos

A medida que se va familiarizando con la sintaxis y las variables de Markdown, puede insertar contenidos aún más enriquecidos en el bloque Markdown, ¡como por ejemplo HTML!

### 3.1 Ejemplo HTML

Si no tiene experiencia con la sintaxis HTML, puede pedir a Deepseek que se lo redacte (atención: no se admite la etiqueta `script`; se recomienda que todos los estilos se escriban en un `div` local).

A continuación se muestra un ejemplo de aviso elegante:

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 20px; padding: 20px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Join Us for a Fun Getaway!</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Hi Everyone,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We're excited to invite you to an awesome group outing filled with laughter, adventure, and great vibes!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Mark your calendars for <span style="color: red; font-weight: bold; font-size: 1.5em;">November 10, 2025</span>, and get ready to explore, relax, and enjoy some quality time together.</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We'll share more details about the itinerary and meeting spot soon—stay tuned!</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">Can't wait to see you there!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Cheers,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Your Event Team</p>
</div>

```

![20250227092832](https://static-docs.nocobase.com/20250227092832.png)

![20250227093003](https://static-docs.nocobase.com/20250227093003.png)

### 3.2 Ejemplo de animación

Incluso podemos combinarlo con CSS para conseguir efectos sencillos de animación, similares al mostrar y ocultar dinámicos de una presentación (¡pruebe a pegar el siguiente código en Markdown y vea el resultado!):

```html
<div style="background-color: #f8e1e1; border: 2px solid #d14; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); animation: fadeInOut 3s infinite;">
    <h2 style="color: #d14; font-family: 'Arial', sans-serif;">🎉 Special Announcement 🎉</h2>
    <p style="color: #333; font-size: 18px; font-family: 'Georgia', serif;">Thank you for your support and attention! We will hold a special event next Monday, stay tuned!</p>
    <button style="background-color: #d14; color: white; border: none; border-radius: 5px; padding: 10px 20px; cursor: pointer;">Click to Learn More</button>
</div>

<style>
@keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translateY(-20px); }
    10%, 90% { opacity: 1; transform: translateY(0); }
}
</style>

```

![](https://static-docs.nocobase.com/202502270933fade-out.gif)
