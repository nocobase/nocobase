---
title: "Utilice NocoBase para crear un panel operativo vinculable"
description: "Tomando como ejemplo el panel de operación de la orden de trabajo, el bloque de gráfico, el bloque de filtro y el bloque JS se combinan para lograr filtrado unificado, KPI, desglose de gráfico y estilos personalizados."
keywords: "NocoBase, panel operativo, visualización de datos, bloque de gráfico, bloque de filtro, bloque JS, desglose de gráfico"
---

# Utilice NocoBase para crear un panel operativo vinculable

Este artículo toma el panel de operaciones del "sistema de órdenes de trabajo" como ejemplo para presentar cómo usar el bloque de gráfico, el bloque de filtro y el bloque JS de NocoBase en combinación para crear un panel de datos que admita vinculación de filtros, desglose de gráficos y estilos personalizados.

Aunque los ejemplos provienen de escenarios de órdenes de trabajo, estos métodos también son aplicables a sistemas comerciales como CRM, operaciones de equipos, gestión de proyectos, flujo de aprobación, éxito del cliente, etc.

:::tip
Lo que este artículo quiere presentar no es "cómo usar bloques JS para escribir una pantalla grande", sino cómo combinar las capacidades de bloques nativos de NocoBase y los bloques JS: deje que los bloques nativos sean responsables de las capacidades estándar y deje que los bloques JS complementen la experiencia personalizada.
:::

![](https://static-docs.nocobase.com/202607121920705.png)

## objetivo de la escena

Esperamos crear un panel de operaciones para ayudar al equipo de operación o servicio a determinar rápidamente la carga de trabajo actual:

- ¿Cuántas órdenes de trabajo abiertas hay actualmente?
- ¿Qué órdenes de trabajo están en riesgo de SLA?
- ¿Cuál es la tendencia en las nuevas órdenes de trabajo?
- ¿Cuál es el estado y la distribución de prioridad de las órdenes de trabajo?
- Después de hacer clic en un gráfico, puede ver los detalles correspondientes.

La página se puede dividir aproximadamente en cuatro capas:

1. Área de filtro superior: hora, grupo de servicios, tipo de solicitud, prioridad, estado del SLA
2. Área de estadísticas de KPI: Pendientes pendientes, No asignados, Aviso de SLA, etc.
3. Área de análisis de gráficos: tendencia, estado, SLA, distribución de prioridad
4. Área de detalles detallados: haga clic en el gráfico para mostrar los registros coincidentes

## Primero, aclarar una idea de construcción.

Cuando muchas personas crean paneles de datos, tienden a pensar en el problema como una de dos opciones:

Utilice todos los bloques nativos de NocoBase, que son fáciles de configurar, pero le preocupa que el estilo y la interacción no sean lo suficientemente flexibles; o simplemente escriba un bloque JS grande y controle la consulta, el gráfico, el filtrado y el desglose usted mismo, pero esto perderá la conveniencia que brinda la configuración de código bajo.

De hecho, la forma más recomendada es combinar los dos.

En este panel de Operaciones, no escribimos la página completa como una pantalla JS grande, sino que la dividimos según las responsabilidades:

- El filtrado superior utiliza el bloque de filtrado que viene con el sistema NocoBase;
- Los gráficos de tendencias, la distribución de estado y la distribución de SLA utilizan bloques de gráficos nativos;
- Las tarjetas KPI y los detalles desglosados ​​utilizan bloques JS;
- Los bloques de filtro afectan tanto a los bloques de gráficos como a los bloques JS;
- Después de hacer clic en el gráfico, las condiciones de desglose se pasan al bloque de detalles JS a continuación.

La ventaja de esto es que las estadísticas y el filtrado estándar aún conservan las capacidades de configuración de NocoBase, mientras que los bloques JS completan la visualización personalizada y las interacciones complejas. La página no es "sólo configurable" ni "todo el código", pero la configuración y el código realizan cada uno sus propias funciones.

---

## 1. Cómo personalizar el estilo del bloque del gráfico

![](https://static-docs.nocobase.com/202607121920941.png)

El bloque de gráficos de NocoBase puede usar primero el generador de consultas para definir el calibre estadístico y luego usar la opción ECharts personalizada para ajustar el estilo.

Tomando como ejemplo las "estadísticas de estado de la orden de trabajo", el generador de consultas se puede configurar como:

- Ficha técnica: entradas
- Métricas: recuento de ID, alias ticketCount
- Dimensiones: estado

La clave es que al personalizar el estilo, no es necesario reescribir la consulta, solo necesita procesar la visualización del gráfico según `ctx.data.objects`.

```javascript
const rows = Array.isArray(ctx.data?.objects) ? ctx.data.objects : [];
```

Esta línea de código lee los resultados de la consulta del gráfico. Luego defina etiquetas de estado y colores:

```javascript
const labels = {
  new: ctx.t('New'),
  open: ctx.t('Open'),
  pending_customer: ctx.t('Pending customer'),
  resolved: ctx.t('Resolved'),
  closed: ctx.t('Closed'),
};

const colors = {
  new: '#1677ff',
  open: '#22a06b',
  pending_customer: '#f59f00',
  resolved: '#13c2c2',
  closed: '#8c8c8c',
};
```

Se recomienda que toda la redacción visible utilice `ctx.t()` para facilitar el soporte posterior en varios idiomas.

Al generar datos del gráfico, puede adjuntar información detallada a cada punto de datos del gráfico:

```javascript
const data = rows.map((row) => ({
  value: Number(row.ticketCount || 0),
  itemStyle: {
    color: colors[row.status] || '#8c8c8c',
    borderRadius: [6, 6, 0, 0],
  },
  ticketingDrilldown: {
    label: ctx.t('Status') + ': ' + (labels[row.status] || row.status),
    filter: { status: { $eq: row.status } },
  },
}));
```

Lo más importante aquí es `ticketingDrilldown`. No es un campo estándar de ECharts, sino un contexto empresarial que ponemos nosotros mismos, que se utilizará al hacer clic en el gráfico más adelante.

Finalmente regrese a la opción ECharts:

```javascript
return {
  grid: { top: 28, right: 22, bottom: 48, left: 42 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: rows.map((row) => labels[row.status] || row.status),
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
  },
  series: [
    {
      name: ctx.t('Tickets'),
      type: 'bar',
      barWidth: 36,
      data,
    },
  ],
};
```

La idea central de esta parte es:

- El generador de consultas es responsable de las estadísticas;
- La opción personalizada es responsable de la expresión visual;
- Los campos personalizados son responsables de llevar el contexto desglosado.

---

## 2. Deje que el bloque de filtro del sistema se convierta en el alcance de observación de toda la página.

![](https://static-docs.nocobase.com/202607121920687.png)

El área de filtrado en el panel operativo no debe ser simplemente una forma aislada. Representa el diámetro de observación actual de toda la página.

Por ejemplo, si el usuario selecciona un grupo de servicios, un tipo de solicitud y una hora de creación, los KPI, los gráficos de tendencias, la distribución del estado y los detalles detallados deben mostrarse en función del mismo conjunto de condiciones. De lo contrario, los números en diferentes bloques de la página lucharán entre sí y será difícil para los usuarios juzgar qué datos son el resultado dentro del rango actual.

Aquí utilizamos directamente el bloque de filtrado que viene con el sistema NocoBase en lugar de escribir un componente de filtrado nosotros mismos. Los bloques de filtro nativos se pueden vincular naturalmente a bloques de gráfico, lo que permite que el bloque de gráfico continúe usando el generador de consultas, permisos, mecanismos de actualización y filtrado.

Top `Dashboard scope` puede configurar estos elementos de filtro:

- Created at
- Service group
- Request type
- Priority
- SLA status

Para los bloques JS, solo necesita leer el mismo conjunto de condiciones de filtro en el código y luego convertirlas en filtros de consulta. De esta manera, los KPI y los detalles desglosados ​​también pueden ser coherentes con el gráfico nativo.

La combinación de condiciones de filtro se puede resumir en una pequeña función:

```javascript
function combineFilters(...filters) {
  const parts = filters.filter(Boolean);
  if (!parts.length) return undefined;
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}
```

Contar por filtro:

```javascript
async function countTickets(filter) {
  const resource = ctx.makeResource('MultiRecordResource');
  resource.setResourceName('tickets');
  resource.setPageSize(1);

  if (filter) {
    resource.setFilter(filter);
  }

  await resource.refresh();

  const meta = resource.getMeta?.() || {};
  return Number(meta.count || meta.total || 0);
}
```

Los puntos clave aquí son:

```javascript
resource.setFilter(filter);
await resource.refresh();
```

El bloque JS consulta datos comerciales a través de recursos en lugar de escribir SQL directamente. Esto hace que sea más fácil mantener la coherencia con los permisos, las fuentes de datos y los tiempos de ejecución de las páginas de NocoBase.

---

## 3. Utilice bloques JS para mostrar tarjetas KPI

![](https://static-docs.nocobase.com/202607121920374.png)

Los KPI se adaptan mejor al uso de bloques JS. Porque los KPI no suelen ser una única consulta, sino una combinación de múltiples calibres de negocio: sin terminar, sin asignar, advertencia de SLA, SLA incumplido, nuevo, resuelto, etc.

El bloque JS puede volver a consultar datos según el rango de filtrado actual y representarlos en una tarjeta estadística.

```javascript
const { Card, Col, Row, Statistic, Tag } = ctx.libs.antd;

const scopeFilter = getDashboardScopeFilter();

const openBacklog = await countTickets(
  combineFilters(scopeFilter, {
    status: { $notIn: ['resolved', 'closed', 'cancelled'] },
  }),
);

ctx.render(
  <Row gutter={[12, 12]}>
    <Col span={6}>
      <Card size="small">
        <Tag color="blue">{ctx.t('Active')}</Tag>
        <Statistic title={ctx.t('Open backlog')} value={openBacklog} />
      </Card>
    </Col>
  </Row>,
);
```

Los puntos clave de los bloques JS son:

- Utilice `ctx.makeResource()` para consultar datos;
- Utilice `ctx.libs.antd` para representar la interfaz;
- Utilice `ctx.render()` para generar contenido;
- Vuelva a renderizar fragmentos JS después de filtrar los cambios.

En una página real, el botón de filtro y el botón de reinicio pueden configurar el flujo de eventos para que actualicen el bloque KPI JS y el bloque JS detallado al mismo tiempo después de completar la acción de filtro nativo. De esta manera, el usuario hace clic una vez para filtrar y tanto los gráficos como el contenido personalizado se actualizarán en función del mismo rango.

---

## 4. Bloque JS de vinculación de gráficos para desglose

![](https://static-docs.nocobase.com/202607121921577.png)

Hacer clic en el gráfico para profundizar es una interacción muy práctica en el panel.

En el escenario de la orden de trabajo, el usuario hace clic en la columna "Estado: Abierto" y todas las órdenes de trabajo abiertas se muestran en el área de detalles a continuación; cuando el usuario hace clic en "SLA incumplido", todas las órdenes de trabajo de horas extra se muestran a continuación.

La idea de implementación es:

1. Los puntos de datos del gráfico llevan `ticketingDrilldown`;
2. El evento del gráfico lee esta información detallada;
3. Escriba información detallada en el contexto del bloque JS de destino;
4. Active el bloque JS de destino para que se vuelva a renderizar.

El código clave en el evento del gráfico es el siguiente. Primero busque el bloque JS desglosado:

```javascript
const DRILLDOWN_TARGET_UID = 'v7mioopm6rm';

function getDrilldownTarget() {
  if (typeof ctx.getModel === 'function') {
    return ctx.getModel(DRILLDOWN_TARGET_UID);
  }

  const engine =
    ctx.model?.flowEngine || ctx.model?.context?.flowEngine || ctx.engine;
  return engine?.getModel?.(DRILLDOWN_TARGET_UID);
}
```

Luego escriba las condiciones de desglose obtenidas al hacer clic en el gráfico en el bloque de destino:

```javascript
function applyDrilldown(drilldown) {
  if (!drilldown?.filter) return;

  const target = getDrilldownTarget();
  if (!target?.context?.defineProperty) return;

  target.context.defineProperty('ticketingDashboardDrilldown', {
    value: drilldown,
  });

  target.rerender?.();
}
```

Las más críticas son estas dos líneas:

```javascript
target.context.defineProperty('ticketingDashboardDrilldown', {
  value: drilldown,
});
target.rerender?.();
```

La primera línea pasa la condición de profundización al bloque JS y la segunda línea activa la actualización del bloque JS.

Finalmente vincule el evento de clic en el gráfico:

```javascript
const clickHandler = (params) => {
  applyDrilldown(params?.data?.ticketingDrilldown);
};

chart.on('click', clickHandler);

return () => chart.off('click', clickHandler);
```

Se recomienda aquí que debe devolver la limpieza:

```javascript
return () => chart.off('click', clickHandler);
```

De esta manera, cuando el gráfico se reconfigura o se vuelve a representar, los eventos antiguos se pueden limpiar para evitar enlaces repetidos.

El código relacionado con el evento de clic anterior se aplica a [v2.2.0-beta.10](https://github.com/nocobase/nocobase/releases/tag/v2.2.0-beta.10) y versiones superiores. Referencia al código de la versión anterior:

```javascript
chart.off('click');
chart.on('click', clickHandler);
```

---

## 5. Cómo mostrar detalles en bloques JS desglosados

![](https://static-docs.nocobase.com/202607121921601.png)

Profundice en el bloque JS para leer el `ticketingDashboardDrilldown` que acaba de escribir y luego consulte los datos de acuerdo con el filtro que contiene.

```javascript
const drilldown = ctx.model?.context?.ticketingDashboardDrilldown;

if (!drilldown) {
  ctx.render(
    <Alert
      type="info"
      showIcon
      message={ctx.t('Select a chart segment to inspect matching tickets')}
    />,
  );
  return;
}
```

Si el usuario no ha hecho clic en el gráfico, muestre un mensaje. Después de hacer clic, consulte la orden de trabajo según `drilldown.filter`:

```javascript
const resource = ctx.makeResource('MultiRecordResource');
resource.setResourceName('tickets');
resource.setFilter(drilldown.filter);
resource.setPageSize(10);
await resource.refresh();

const rows = resource.getData?.() || [];
```

Luego renderice la tabla:

```javascript
const { Table, Typography } = ctx.libs.antd;

ctx.render(
  <>
    <Typography.Title level={5}>
      {ctx.t('Drilldown')}: {drilldown.label}
    </Typography.Title>

    <Table
      size="small"
      rowKey="id"
      dataSource={rows}
      pagination={false}
      columns={[
        { title: ctx.t('Ticket No'), dataIndex: 'ticketNo' },
        { title: ctx.t('Title'), dataIndex: 'title' },
        { title: ctx.t('Status'), dataIndex: 'status' },
        { title: ctx.t('Priority'), dataIndex: 'priority' },
      ]}
    />
  </>,
);
```

Si necesita borrar las condiciones de desglose, puede consultar

```javascript
function clearChartDrilldown() {
  if (ctx.model?.context?.defineProperty) {
    ctx.model.context.defineProperty('ticketingDashboardDrilldown', {
      value: null,
    });
  }
  if (typeof ctx.model?.rerender === 'function') {
    ctx.model.rerender();
  }
}
```

Los puntos clave de esta parte son:

- El gráfico sólo se encarga de pasar el filtro;
- El bloque JS es responsable de consultar y mostrar detalles;
- Haga clic en diferentes gráficos para compartir el mismo bloque de desglose.

---

## Sugerencias prácticas

### 1. No se apresure a codificar la página compleja en su totalidad

La lección más importante de esta página es: no compare las capacidades nativas con las capacidades de JS.

Si una capacidad ya es nativa de NocoBase, como filtrado, consulta de gráficos, visualización de tablas y control de permisos, el bloque nativo se usará primero. De esta manera, cuando los campos, las condiciones del filtro y el calibre del gráfico se ajusten posteriormente, aún se podrán configurar en la interfaz.

Los bloques JS son más adecuados para procesar partes en las que los bloques nativos no son buenos, como combinar múltiples indicadores en un conjunto de KPI, estilos de tarjetas especiales, mostrar un conjunto de detalles personalizados después de hacer clic en el gráfico o pasar contexto comercial entre diferentes bloques.

En otras palabras, el bloque nativo es responsable de las "capacidades estándar configurables" y el bloque JS es responsable de la "experiencia personalizada orientada al negocio". Esta es también la idea de construcción más reutilizable para este tablero.

### 2. Para estadísticas simples, utilice primero el generador de consultas del bloque de gráficos.

Esto preserva las capacidades estándar de consulta, permisos, filtrado y actualización de NocoBase. Sólo cuando el estilo de gráfico predeterminado no pueda expresar el enfoque empresarial, utilice la opción ECharts personalizada para la optimización visual.

### 3. Las tarjetas KPI dan prioridad al uso de bloques JS

Los KPI a menudo requieren múltiples consultas, combinaciones de condiciones y diseños personalizados, y los bloques JS son más flexibles. Especialmente cuando los KPI deben responder al mismo conjunto de condiciones de filtrado del sistema, será más claro utilizar bloques JS para manejarlos de manera uniforme.

### 4. Los eventos del gráfico deberían devolver la limpieza

Método de escritura recomendado:

```javascript
const handler = (params) => {
  // handle click
};

chart.on('click', handler);

return () => chart.off('click', handler);
```

No utilice directamente `chart.off('click')` para borrar todos los eventos de clic, ya que esto puede eliminar accidentalmente el bloque del gráfico o configurar el monitoreo propio del panel.

---

## Deja que la IA te ayude a construirlo

Este tipo de panel es muy adecuado para la generación asistida por IA porque involucra modelos de datos, calibres estadísticos, estilos de gráficos e interacciones de páginas al mismo tiempo. Puede entregarle el contenido de este artículo y hacer preguntas utilizando las palabras clave a continuación.

Puedes hacer preguntas como esta:

```markdown
Estoy usando NocoBase para crear un panel operativo para un sistema de órdenes de trabajo.
Tome el escenario de la orden de trabajo como ejemplo y ayúdeme a diseñar un panel de operaciones.

La tabla de datos de tickets contiene:
ticketNo、title、status、priority、slaStatus、
requestType、serviceGroup、assignee、createdAt、updatedAt。

La página requiere:

1. Filtro superior: Creado en, Grupo de servicios, Tipo de solicitud, Prioridad, Estado del SLA.
2. Tarjetas KPI: Trabajo pendiente abierto, No asignado, Advertencia de SLA, SLA incumplido, Tickets nuevos, Tickets resueltos.
3. Gráfico: tendencia de los tickets creados, estado del ticket, estado del SLA, combinación de prioridades.
4. Después de hacer clic en el gráfico, el bloque JS a continuación muestra la tabla desglosada del Ticket correspondiente.
5. El estilo del gráfico debe ser adecuado al mercado operativo, con colores claros y diseño compacto.
6. Utilice ctx.t() para todas las copias JS.
7. Los eventos del gráfico utilizan chart.on y devuelven la función de limpieza.
8. Priorice el uso de bloques de filtros y bloques de gráficos nativos de NocoBase. Utilice únicamente bloques JS para KPI, detalles detallados, estilos especiales e interacciones entre bloques. No escriba la página completa como un bloque JS grande.

Proporcione las ideas de configuración para cada bloque y marque el código JS clave.
```

Si ya tienes una página, también puedes dejar que la IA te ayude a optimizarla:

```markdown
Este es mi diseño actual de panel de NocoBase:
En la parte superior está el área de filtro, en el medio hay 4 gráficos y debajo está el bloque JS desglosado.
Ayúdenme a optimizar desde la perspectiva de la experiencia del operador:

1. ¿Qué indicadores debe mostrar el KPI?
2. Si existe la necesidad de vincular los gráficos;
3. Qué columnas deben mostrarse en los detalles desglosados;
4. ¿Cómo deberían organizarse los eventos de gráficos y bloques JS?
5. Qué código se debe colocar en la opción personalizada del gráfico y cuál se debe colocar en el bloque JS.
```

De esta manera, el contenido generado por la IA estará más cerca del negocio real, en lugar de limitarse a proporcionar código aislado.

:::warning
Si elige dejar que AI lo ayude a construirlo, utilice el administrador de copias de seguridad para hacer una copia de seguridad del proyecto antes de comenzar.
:::

## Documentación de referencia

- [Configuración del gráfico ](/data-visualization/guide/chart-options)
- [Ejecución de interfaz JS](/runjs/)
- [Formulario de filtro ](/interface-builder/blocks/filter-blocks/form)
- [Construcción de IA - Construcción de interfaz ](/ai-builder/ui-builder)
- [ECharts Options](https://echarts.apache.org/en/option.html)
