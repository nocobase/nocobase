# Seguimiento de leads y gestión de estados

## 1. Introducción

### 1.1 Objetivo del capítulo

En este capítulo aprenderemos juntos a implementar la conversión de oportunidades del CRM en NocoBase. Mediante el seguimiento de leads y la gestión de estados, podrá mejorar la eficiencia del negocio y conseguir un control más preciso del proceso de ventas.

### 1.2 Vista previa del resultado final

En el capítulo anterior explicamos cómo gestionar las relaciones entre los datos de leads, empresas, contactos y oportunidades. Ahora nos centraremos en el módulo de leads, abordando principalmente cómo realizar el seguimiento y la gestión de estados de los leads. Eche un vistazo al siguiente ejemplo:
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. Estructura de la Collection de leads

### 2.1 Presentación de la Collection de leads

En la función de seguimiento de leads, el campo "estado" (status) juega un papel crítico, no solo porque refleja el progreso actual del lead (por ejemplo, No cualificado, Nuevo lead, En proceso, En seguimiento, En negociación, Completado), sino también porque dirige la visualización y los cambios de todo el formulario. La siguiente tabla muestra la estructura de campos de la collection de leads y sus descripciones detalladas:


| Field name     | Nombre del campo   | Field interface  | Description                                                                                            |
| -------------- | ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------ |
| id             | **Id**             | Integer          | Clave principal                                                                                        |
| account_id     | **account_id**     | Integer          | Clave foránea a ACCOUNT                                                                                |
| contact_id     | **contact_id**     | Integer          | Clave foránea a CONTACT                                                                                |
| opportunity_id | **opportunity_id** | Integer          | Clave foránea a OPPORTUNITY                                                                            |
| name           | **Nombre del lead**| Single line text | Nombre del cliente potencial                                                                           |
| company        | **Empresa**        | Single line text | Empresa donde trabaja el cliente potencial                                                             |
| email          | **Correo**         | Email            | Dirección de correo electrónico del cliente potencial                                                  |
| phone          | **Teléfono**       | Phone            | Teléfono de contacto                                                                                   |
| status         | **Estado**         | Single select    | Estado actual del lead (No cualificado, Nuevo lead, En proceso, En seguimiento, En negociación, Completado) |
| Account        | **Empresa**        | Many to one      | Relacionada con la collection Empresa                                                                  |
| Contact        | **Contacto**       | Many to one      | Relacionada con la collection Contacto                                                                 |
| Opportunity    | **Oportunidad**    | Many to one      | Relacionada con la collection Oportunidad                                                              |

## 3. Crear un bloque de tabla (table block) y un bloque de detalle de Leads

### 3.1 Notas sobre la creación

Primero necesitamos crear un table block "Leads" para mostrar los campos necesarios. Al mismo tiempo, configuraremos un bloque de detalle en el lado derecho de la página: cuando haga clic en un registro, en el lado derecho se mostrará automáticamente la información detallada correspondiente. Vea la siguiente imagen para conocer el resultado de la configuración:
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. Configurar los botones de acción

### 4.1 Visión general de los botones

Para satisfacer las distintas necesidades operativas, debemos crear un total de 11 botones. Cada botón se muestra de manera diferente (oculto, activo o deshabilitado) según el estado (status) del registro, lo que guía al usuario a operar siguiendo el flujo de negocio correcto.
![20250226173632](https://static-docs.nocobase.com/20250226173632.png)

### 4.2 Configuración detallada de cada botón

#### 4.2.1 Botón de edición

- Regla de enlace: cuando el status del registro sea "Completed", deshabilitar automáticamente el botón para evitar ediciones innecesarias.

#### 4.2.2 Botón "No cualificado" 1 (no activo)

- Estilo y aspecto: el título se muestra como "Unqualified >".
- Operación y comportamiento: al hacer clic, ejecuta una operación de update que actualiza el status del registro a "Unqualified". Tras la actualización exitosa, vuelve a la página anterior y muestra el mensaje de éxito "Unqualified".
- Regla de enlace: solo se muestra cuando el status del registro está vacío; en cuanto el status tiene un valor, este botón se oculta automáticamente.

#### 4.2.3 Botón "No cualificado" 2 (estado activo)

- Estilo y aspecto: igualmente se muestra como "Unqualified >".
- Operación y comportamiento: actualiza el status del registro a "Unqualified".
- Regla de enlace: cuando el status está vacío, este botón se oculta; si el status es "Completed", el botón se deshabilita.

#### 4.2.4 Botón "Nuevo lead" 1 (no activo)

- Estilo y aspecto: el título se muestra como "New >".
- Operación y comportamiento: al hacer clic, actualiza el registro estableciendo el status como "New" y muestra el mensaje "New" tras la actualización.
- Regla de enlace: cuando el status del registro ya es "New", "Working", "Nurturing" o "Completed", este botón se oculta.

#### 4.2.5 Botón "Nuevo lead" 2 (estado activo)

- Estilo y aspecto: el título sigue siendo "New >".
- Operación y comportamiento: igualmente actualiza el status del registro a "New".
- Regla de enlace: se oculta cuando el status es "Unqualified" o está vacío; si el status es "Completed", el botón se deshabilita.

#### 4.2.6 Botón "En proceso" (no activo)

- Estilo y aspecto: el título se muestra como "Working >".
- Operación y comportamiento: al hacer clic, actualiza el status del registro a "Working" y muestra el mensaje de éxito "Working".
- Regla de enlace: si el status del registro ya es "Working", "Nurturing" o "Completed", este botón se oculta.

#### 4.2.7 Botón "En proceso" (estado activo)

- Estilo y aspecto: el título sigue siendo "Working >".
- Operación y comportamiento: actualiza el status del registro a "Working".
- Regla de enlace: cuando el status es "Unqualified", "New" o está vacío, este botón se oculta; si el status es "Completed", el botón se deshabilita.

#### 4.2.8 Botón "En seguimiento" (no activo)

- Estilo y aspecto: el título se muestra como "Nurturing >".
- Operación y comportamiento: al hacer clic, actualiza el status del registro a "Nurturing" y muestra el mensaje de éxito "Nurturing".
- Regla de enlace: si el status del registro ya es "Nurturing" o "Completed", el botón se oculta.

#### 4.2.9 Botón "En seguimiento" (estado activo)

- Estilo y aspecto: el título sigue siendo "Nurturing >".
- Operación y comportamiento: igualmente actualiza el status del registro a "Nurturing".
- Regla de enlace: se oculta cuando el status es "Unqualified", "New", "Working" o está vacío; si el status es "Completed", el botón se deshabilita.

#### 4.2.10 Botón "Convertir"

- Estilo y aspecto: el título se muestra como "transfer", abriéndose como ventana modal.
- Operación y comportamiento: se utiliza principalmente para realizar la operación de conversión del registro. Tras la operación de actualización, el sistema muestra una interfaz con drawer, Tabs y formulario que facilita la conversión del registro.
- Regla de enlace: cuando el status del registro es "Completed", este botón se oculta para evitar conversiones repetidas.
  ![](https://static-docs.nocobase.com/20250226094223.png)

#### 4.2.11 Botón "Conversión completada" (estado activo)

- Estilo y aspecto: el título se muestra como "transfered", abriéndose también como ventana modal.
- Operación y comportamiento: este botón solo sirve para mostrar la información tras finalizar la conversión y no permite edición.
- Regla de enlace: solo se muestra cuando el status del registro es "Completed"; en otros estados (como "Unqualified", "New", "Working", "Nurturing" o vacío), permanece oculto.
  ![](https://static-docs.nocobase.com/20250226094203.png)

### 4.3 Resumen de la configuración de los botones

- Cada función ofrece distintos estilos de botón según se encuentre en estado activo o no activo.
- Mediante reglas de enlace, se controla dinámicamente la visualización de los botones (ocultar o deshabilitar) según el status del registro, guiando así al equipo comercial a través del flujo de trabajo correcto.

## 5. Configuración de las reglas de enlace del formulario

### 5.1 Regla 1: mostrar solo el nombre

- Cuando el registro no está confirmado o el status está vacío, solo se muestra el nombre.
  ![](https://static-docs.nocobase.com/20250226092629.png)
  ![](https://static-docs.nocobase.com/20250226092555.png)

### 5.2 Regla 2: optimización de la visualización en estado "Nuevo lead"

- Cuando el status sea "Nuevo lead", la página oculta el nombre de la empresa y muestra los datos de contacto.
  ![](https://static-docs.nocobase.com/20250226092726.png)

## 6. Reglas de la página Markdown y sintaxis Handlebars

### 6.1 Visualización dinámica de textos

En la página utilizamos la sintaxis Handlebars para mostrar dinámicamente distintos avisos según el estado del registro. A continuación se muestra el código de ejemplo para cada estado:

Cuando el estado es "No cualificado":

```markdown
{{#if (eq $nRecord.status "No cualificado")}}
**Realice el seguimiento de la información de los leads no cualificados.**  
Si su lead no está interesado en el producto o ha dejado la empresa, puede no estar cualificado.  
- Anote las lecciones aprendidas para futuras consultas  
- Guarde los detalles del contacto y las vías de comunicación  
{{/if}}
```

Cuando el estado es "Nuevo lead":

```markdown
{{#if (eq $nRecord.status "Nuevo lead")}}
**Identifique los productos o servicios necesarios para esta oportunidad.**  
- Recopile casos de éxito, materiales de referencia o análisis competitivos  
- Confirme a sus principales partes interesadas  
- Determine los recursos disponibles  
{{/if}}
```

Cuando el estado es "En proceso":

```markdown
{{#if (eq $nRecord.status "En proceso")}}
**Presente su solución a las partes interesadas.**  
- Comunique el valor de la solución  
- Defina claramente el cronograma y el presupuesto  
- Acuerde con el cliente cuándo y cómo cerrarán el acuerdo  
{{/if}}
```

Cuando el estado es "En seguimiento":

```markdown
{{#if (eq $nRecord.status "En seguimiento")}}
**Determine el plan de implementación del cliente.**  
- Cierre los acuerdos según las necesidades  
- Siga los procesos internos de descuento  
- Obtenga el contrato firmado  
{{/if}}
```

Cuando el estado es "Conversión completada":

```markdown
{{#if (eq $nRecord.status "Conversión completada")}}
**Confirme el plan de implementación y los pasos finales.**  
- Asegúrese de que estén formalizados todos los acuerdos y firmas pendientes  
- Cumpla con la política interna de descuentos  
- Confirme que el contrato está firmado y la implementación marcha según lo previsto  
{{/if}}
```

## 7. Mostrar los objetos relacionados tras la conversión y los enlaces de salto

### 7.1 Notas sobre los objetos relacionados

Tras la conversión, queremos mostrar los objetos relacionados (empresa, contacto, oportunidad) y añadir los enlaces de salto a la página de detalle. Atención: en otras ventanas emergentes o páginas, la última parte del formato del enlace de detalle (el número que sigue a filterbytk) corresponde al id del objeto actual, por ejemplo:

```text
http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/1
```

### 7.2 Generación de enlaces relacionados con Handlebars

Para Empresa:

```markdown
{{#if (eq $nRecord.status "Completado")}}
**Account:**
[{{$nRecord.account.name}}](http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

Para Contacto:

```markdown
{{#if (eq $nRecord.status "Completado")}}
**Contact:**
[{{$nRecord.contact.name}}](http://localhost:13000/apps/tsting/admin/1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

Para Oportunidad:

```markdown
{{#if (eq $nRecord.status "Completado")}}
**Opportunity:**
[{{$nRecord.opportunity.name}}](http://localhost:13000/apps/tsting/admin/si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
{{/if}}
```

![](https://static-docs.nocobase.com/20250226093501.png)

## 8. Ocultar los objetos relacionados pero conservar el valor

Para garantizar que la información relacionada se muestre correctamente tras la conversión, los campos "Empresa", "Contacto" y "Oportunidad" deben configurarse como "Ocultar (conservar valor)". De este modo, aunque estos campos no aparecen en el formulario, sus valores se siguen registrando y transmitiendo.
![](https://static-docs.nocobase.com/20250226093906.png)

## 9. Evitar la modificación del estado tras la conversión

Para impedir que el estado se cambie por error después de la conversión, hemos añadido a todos los botones una condición: cuando el estado es "Completado", todos los botones se deshabilitan.
![](https://static-docs.nocobase.com/20250226094302.png)

## 10. Conclusión

¡Una vez completados todos los pasos anteriores, su funcionalidad de seguimiento y conversión de leads ya está lista! A través de esta explicación paso a paso esperamos que comprenda con claridad cómo se implementan en NocoBase los enlaces dinámicos de cambios de estado en formularios. ¡Le deseamos éxito en su uso y que disfrute trabajando con la herramienta!
