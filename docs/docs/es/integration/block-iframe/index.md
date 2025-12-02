---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Bloque Iframe

## Introducción

El bloque Iframe le permite incrustar páginas web o contenido externo en la página actual. Puede integrar aplicaciones externas fácilmente configurando una URL o insertando directamente código HTML. Al usar HTML, tiene la flexibilidad de personalizar el contenido para satisfacer sus necesidades de visualización específicas, lo que lo hace ideal para escenarios personalizados. Este enfoque permite cargar recursos externos sin redirecciones, mejorando la experiencia del usuario y la interactividad de la página.

## Instalación

Es un plugin integrado, no requiere instalación.

## Añadir bloques

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Configure la URL o el HTML para incrustar directamente la aplicación externa.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Motor de plantillas

### Plantilla de cadena

Es el motor de plantillas predeterminado.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Para obtener más información, consulte la documentación del motor de plantillas de Handlebars.

## Paso de variables

### Soporte HTML para el análisis de variables

#### Soporte para seleccionar variables del selector de variables en el contexto del bloque actual

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Soporte para inyectar variables en la aplicación y utilizarlas a través de código

También puede inyectar variables personalizadas en la aplicación a través de código y utilizarlas en HTML. Por ejemplo, para crear una aplicación de calendario dinámico usando Vue 3 y Element Plus:

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue3 CDN Example</title>
    <script src="https://cdn.bootcdn.net/ajax/libs/vue/3.5.9/vue.global.prod.js"></script>
    <script src="https://unpkg.com/element-plus"></script>
    <script src="https://unpkg.com/element-plus/dist/locale/zh-cn"></script>
    <link
      rel="stylesheet"
      href="https://unpkg.com/element-plus/dist/index.css"
    />
  </head>
  <body>
    <div id="app">
      <el-container>
        <el-main>
          <el-calendar v-model="month">
            <div class="header-container">
              <div class="action-group">
                <span class="month-display">{{ month }}</span>
                <el-button-group>
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(-1)"
                    >Last month</el-button
                  >
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(1)"
                    >Next month</el-button
                  >
                </el-button-group>
              </div>
            </div>
          </el-calendar>
        </el-main>
      </el-container>
    </div>
    <script>
      const { createApp, ref, provide } = Vue;
      const app = createApp({
        setup() {
          const month = ref(new Date().toISOString().slice(0, 7));
          const loading = ref(false);

          const changeMonth = (offset) => {
            const date = new Date(month.value + '-01');
            date.setMonth(date.getMonth() + offset);
            month.value = date.toISOString().slice(0, 7);
          };
          provide('month', month);
          provide('changeMonth', changeMonth);
          return { month, loading, changeMonth };
        },
      });
      app.use(ElementPlus);
      app.mount('#app');
    </script>
  </body>
</html>
```

![20250320163250](https://static-docs.nocobase.com/20250320163250.png)

Ejemplo: Un componente de calendario simple creado con React y Ant Design (antd), utilizando dayjs para manejar las fechas.

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React CDN Example</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.css"
    />
    <script src="https://unpkg.com/dayjs/dayjs.min.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function () {
        const { useState } = React;
        const { Calendar, Button, Space, Typography } = window.antd;
        const { Title } = Typography;
        const CalendarComponent = () => {
          const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
          const [loading, setLoading] = useState(false);
          const changeMonth = (offset) => {
            const newMonth = dayjs(month)
              .add(offset, 'month')
              .format('YYYY-MM');
            setMonth(newMonth);
          };
          return React.createElement(
            'div',
            { style: { padding: 20 } },
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                },
              },
              React.createElement(Title, { level: 4 }, month),
              React.createElement(
                Space,
                null,
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(-1) },
                  'Last month',
                ),
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(1) },
                  'Next month',
                ),
              ),
            ),
            React.createElement(Calendar, {
              fullscreen: false,
              value: dayjs(month),
            }),
          );
        };
        ReactDOM.createRoot(document.getElementById('app')).render(
          React.createElement(CalendarComponent),
        );
      });
    </script>
  </body>
</html>
```

![20250320164537](https://static-docs.nocobase.com/20250320164537.png)

### La URL admite variables

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Para obtener más información sobre las variables, consulte la documentación de Variables.

## Creación de Iframes con bloques JS (NocoBase 2.0)

En NocoBase 2.0, puede usar bloques JS para crear iframes dinámicamente con mayor control. Este enfoque le brinda más flexibilidad para personalizar el comportamiento y el estilo del iframe.

### Ejemplo básico

Cree un bloque JS y use el siguiente código para crear un iframe:

```javascript
// Crea un iframe que llena el contenedor del bloque actual
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Reemplaza los elementos secundarios existentes para que el iframe sea el único contenido
ctx.element.replaceChildren(iframe);
```

### Puntos clave

- **ctx.element**: El elemento DOM del contenedor del bloque JS actual.
- **atributo `sandbox`**: Controla las restricciones de seguridad para el contenido del iframe.
  - `allow-scripts`: Permite que el iframe ejecute scripts.
  - `allow-same-origin`: Permite que el iframe acceda a su propio origen.
- **`replaceChildren()`**: Reemplaza todos los elementos secundarios del contenedor con el iframe.

### Ejemplo avanzado con estado de carga

Puede mejorar la creación de iframes con estados de carga y manejo de errores:

```javascript
// Muestra un mensaje de carga
ctx.message.loading('Cargando contenido externo...');

try {
  // Crea el iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // Añade un listener para el evento de carga
  iframe.addEventListener('load', () => {
    ctx.message.success('Contenido cargado correctamente');
  });

  // Añade un listener para el evento de error
  iframe.addEventListener('error', () => {
    ctx.message.error('Error al cargar el contenido');
  });

  // Inserta el iframe en el contenedor
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('Error al crear el iframe: ' + error.message);
}
```

### Consideraciones de seguridad

Al usar iframes, tenga en cuenta las siguientes mejores prácticas de seguridad:

1.  **Uso de HTTPS**: Siempre que sea posible, cargue el contenido del iframe a través de HTTPS.
2.  **Restricción de permisos de Sandbox**: Habilite solo los permisos de sandbox necesarios.
3.  **Política de seguridad de contenido (CSP)**: Configure los encabezados CSP apropiados.
4.  **Política del mismo origen**: Tenga en cuenta las restricciones de origen cruzado.
5.  **Fuentes confiables**: Cargue contenido solo de dominios confiables.