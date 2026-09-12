# Visión general de las funciones de CRM Sales Cloud

En este capítulo dividimos el sistema en varios módulos según las funciones de negocio y describimos en detalle las funciones principales de cada módulo y su correspondiente estructura de datos. La solución no solo se centra en que los procesos de negocio fluyan con normalidad, sino que también tiene en cuenta la coherencia del almacenamiento de datos y la escalabilidad del sistema.

---

## 1. Gestión de leads

### Descripción general

El módulo de gestión de leads se encarga de capturar y gestionar la información de clientes potenciales. El sistema permite registrar leads desde múltiples canales (sitio web, teléfono, correo, etc.) y ofrece funciones de actualización de estado, registros de seguimiento y notas. Durante la conversión del lead, el sistema detecta automáticamente datos duplicados, garantizando que los leads adecuados se conviertan en clientes, contactos y oportunidades.

### Tablas de datos relacionadas

- **Leads (tabla de leads)**
  Almacena la información básica del lead, como nombre, datos de contacto, origen, estado actual y notas. Registra la fecha de creación y el log de actualizaciones de cada lead, lo que facilita las estadísticas y el análisis posteriores.

---

## 2. Gestión de clientes y contactos

### Descripción general

Este módulo ayuda al usuario a crear y mantener los expedientes de los clientes. La empresa puede registrar el nombre de la empresa, sector, dirección y otra información clave del cliente, y al mismo tiempo gestionar los contactos asociados (nombre, cargo, teléfono y correo). El sistema admite relaciones uno a muchos o muchos a muchos entre clientes y contactos, garantizando la integridad de la información y su actualización sincronizada.

### Tablas de datos relacionadas

- **Accounts (tabla de clientes)**
  Registra los expedientes detallados de los clientes, incluida información básica de la empresa y otros datos comerciales relevantes.
- **Contacts (tabla de contactos)**
  Almacena la información personal de los contactos asociados a los clientes, vinculándola mediante una clave foránea a la tabla de clientes para asegurar la coherencia de los datos.

### Diagrama de flujo de la conversión de leads

![20250225211802](https://static-docs.nocobase.com/20250225211802.png)

- Registro del lead → Seguimiento del lead (actualización de estado) → Validación del lead → Conversión a cliente, contacto y oportunidad

---

## 3. Gestión de oportunidades

### Descripción general

El módulo de gestión de oportunidades se centra en generar oportunidades de venta a partir de los leads convertidos o de la información de clientes existentes. El usuario puede registrar la fecha estimada de cierre, la fase actual, el importe estimado y la probabilidad de éxito de la oportunidad. Asimismo, el sistema permite gestionar las fases de venta de forma dinámica y registrar las razones detalladas en caso de que la oportunidad se pierda, lo que facilita la posterior optimización de la estrategia comercial. Además, el módulo permite asociar varios productos a una misma oportunidad, calculando automáticamente el importe total.

### Tablas de datos relacionadas

- **Opportunities (tabla de oportunidades)**
  Registra la información detallada de cada oportunidad de venta, como fecha de cierre, fase de venta e importe estimado.
- **OpportunityLineItem (tabla de líneas de oportunidad)**
  Almacena la información concreta de los productos asociados a la oportunidad, incluido el ID de producto, la cantidad, el precio unitario y el descuento, con cálculo automático del importe.

### Pasos de conversión

- Creación de la oportunidad → Gestión de la oportunidad (actualización de fase) → Generación del presupuesto → Aprobación del cliente → Generación del pedido de venta → Ejecución del pedido y actualización de estado

---

## 4. Gestión de productos y listas de precios

### Descripción general

Este módulo se encarga de gestionar la información de los productos y sus estrategias de precios. El sistema permite registrar la información básica del producto, como código, nombre, descripción, stock y precio, y admite distintos modelos de precios. Al asociar productos con listas de precios, el usuario puede gestionar de forma flexible las necesidades de precios para distintos mercados y grupos de clientes.

### Tablas de datos relacionadas

- **Products (tabla de productos)**
  Almacena la información detallada de todos los productos, proporcionando los datos base para la generación de presupuestos y pedidos.
- **PriceBooks (tabla de listas de precios)**
  Gestiona los distintos modelos de precios y los productos asociados, permitiendo ajustar la estrategia de precios de forma dinámica según las necesidades del negocio.

---

## 5. Gestión de presupuestos

### Descripción general

El módulo de gestión de presupuestos genera presupuestos formales a partir de oportunidades existentes, registrando la validez del presupuesto, los descuentos, la tasa impositiva y el importe total. El sistema incorpora un proceso de aprobación que permite a la dirección revisar y ajustar el presupuesto, y cada presupuesto puede contener varios detalles de productos, garantizando la precisión de los cálculos.

### Tablas de datos relacionadas

- **Quotes (tabla de presupuestos)**
  Registra la información básica del presupuesto, incluida la oportunidad asociada, la validez, los descuentos, la tasa impositiva y el estado general.
- **QuoteLineItems (tabla de líneas de presupuesto)**
  Almacena los datos detallados de cada producto dentro del presupuesto, calculando automáticamente el importe de cada producto y el importe total del presupuesto.

---

## 6. Gestión de pedidos de venta

### Descripción general

El módulo de gestión de pedidos de venta convierte los presupuestos aprobados en pedidos y realiza el seguimiento de todo el proceso, desde la creación hasta la finalización. El usuario puede consultar en tiempo real el estado del pedido, los registros de aprobación y la situación logística y de envío, lo que le permite controlar mejor el avance de la ejecución del pedido.

### Tablas de datos relacionadas

- **SalesOrders (tabla de pedidos de venta)**
  Registra la información detallada del pedido, incluido el presupuesto asociado, el estado del pedido, los registros de aprobación, el estado de envío y la fecha de creación del pedido.

---

## 7. Gestión de actividades

### Descripción general

El módulo de gestión de actividades ayuda al equipo de ventas a organizar el trabajo diario, incluyendo tareas, reuniones y comunicaciones telefónicas. El sistema permite registrar el contenido específico de la actividad, los participantes y las notas, y ofrece funciones de planificación y recordatorios, asegurando que todas las actividades se ejecuten con éxito según lo previsto.

### Tablas de datos relacionadas

- **Activities (tabla de registros de actividad)**
  Almacena los registros de tareas, reuniones y llamadas, incluido el tipo de actividad, la fecha, los participantes y la información de los clientes u oportunidades asociadas.

---

## 8. Informes y análisis de datos

### Descripción general

Este módulo, mediante estadísticas y gráficos multidimensionales, ayuda a la empresa a conocer en tiempo real el rendimiento de las ventas y la situación de la conversión del negocio. El sistema permite generar embudos de ventas, análisis de tasas de conversión e informes de rendimiento, ofreciendo apoyo a la toma de decisiones de la dirección.

### Notas

Aunque los informes y análisis de datos no cuentan con tablas propias, dependen de los datos almacenados en los demás módulos y, mediante la agregación y el análisis de datos, ofrecen retroalimentación en tiempo real y predicciones de tendencias.

---

## 9. Gestión de campañas de marketing (módulo opcional)

### Descripción general

Como función auxiliar, el módulo de gestión de campañas de marketing se utiliza principalmente para planificar y realizar el seguimiento de las acciones comerciales. El sistema puede registrar la planificación de la campaña, el presupuesto, su ejecución y la evaluación de resultados, así como las estadísticas de tasa de conversión de leads y retorno de la inversión (ROI), proporcionando datos que apoyan las acciones de marketing.

### Notas

La estructura de datos de este módulo puede ampliarse según las necesidades reales; actualmente se centra principalmente en registrar la ejecución de las campañas y complementa los datos del módulo de gestión de leads.
