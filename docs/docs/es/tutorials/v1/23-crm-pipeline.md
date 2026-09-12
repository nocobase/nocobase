# Visualización del pipeline de ventas en CRM

## 1. Introducción

### 1.1 Prefacio

Este capítulo es la segunda parte de la serie de tutoriales [Cómo implementar la conversión de leads de CRM en NocoBase](https://www.nocobase.com/cn/tutorials/how-to-implement-lead-conversion-in-nocobase). En el capítulo anterior presentamos los conceptos básicos de la conversión de leads, incluida la creación de las collections necesarias, la configuración de las páginas de gestión de datos y la implementación de la conversión del lead en empresa, contacto y oportunidad. Este capítulo se centra en la implementación del flujo de seguimiento de leads y la gestión de estados.

🎉 [¡La solución CRM de NocoBase ya está disponible! Bienvenido a probarla](https://www.nocobase.com/cn/blog/crm-solution)

### 1.2 Objetivo del capítulo

En este capítulo aprenderemos juntos a implementar la conversión de leads del CRM en NocoBase. Mediante el seguimiento de leads y la gestión de estados, podrá mejorar la eficiencia del negocio y conseguir un control más preciso del proceso de ventas.

### 1.3 Vista previa del resultado final

En el capítulo anterior explicamos cómo gestionar las relaciones entre los datos de leads, empresas, contactos y oportunidades. Ahora nos centraremos en el módulo de leads, abordando principalmente cómo realizar el seguimiento y la gestión de estados de los leads. Eche un vistazo al siguiente ejemplo:
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. Estructura de la Collection de leads

### 2.1 Presentación de la Collection de leads

En la función de seguimiento de leads, el campo "estado" (status) juega un papel crítico, no solo porque refleja el progreso actual del lead (No cualificado, Nuevo lead, En proceso, En seguimiento, En negociación, Completado), sino también porque dirige la visualización y los cambios de todo el formulario. La siguiente tabla muestra la estructura de campos de la collection de leads y sus descripciones detalladas:


| Field name     | Nombre del campo   | Field interface  | Description                                                                                                |
| -------------- | ------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| id             | **Id**             | Integer          | Clave principal                                                                                            |
| account_id     | **account_id**     | Integer          | Clave foránea a la tabla ACCOUNT (empresa)                                                                 |
| contact_id     | **contact_id**     | Integer          | Clave foránea a la tabla CONTACT (contacto)                                                                |
| opportunity_id | **opportunity_id** | Integer          | Clave foránea a la tabla OPPORTUNITY (oportunidad)                                                         |
| name           | **Nombre del lead**| Single line text | Nombre del cliente potencial                                                                               |
| company        | **Empresa**        | Single line text | Empresa donde trabaja el cliente potencial                                                                 |
| email          | **Correo**         | Email            | Dirección de correo electrónico del cliente potencial                                                      |
| phone          | **Teléfono**       | Phone            | Teléfono de contacto                                                                                       |
| status         | **Estado**         | Single select    | Estado actual del lead, por defecto "No cualificado" (No cualificado, Nuevo lead, En proceso, En seguimiento, En negociación, Completado) |
| Account        | **Empresa**        | Many to one      | Asociado a Empresa                                                                                         |
| Contact        | **Contacto**       | Many to one      | Asociado a Contacto                                                                                        |
| Opportunity    | **Oportunidad**    | Many to one      | Asociado a Oportunidad                                                                                     |

## 3. Crear un bloque de tabla (table block) y un bloque de detalle de Leads

### 3.1 Notas sobre la creación

Primero necesitamos crear un table block "Leads" para mostrar los campos necesarios. Al mismo tiempo, configuraremos un bloque de detalle en el lado derecho de la página: cuando haga clic en un registro, en el lado derecho se mostrará automáticamente la información detallada correspondiente. Vea la siguiente imagen para conocer el resultado de la configuración:
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. Configurar los botones de acción

### 4.1 Visión general de los botones

Para cubrir las distintas necesidades de operación, debemos crear un total de 10 botones. Cada botón se muestra de manera diferente (oculto, activo o deshabilitado) según el estado (status) del registro, lo que guía al usuario a operar siguiendo el flujo de negocio correcto.
![20250311083825](https://static-docs.nocobase.com/20250311083825.png)

### 4.2 Configuración detallada de cada botón


| Botón                                | Estilo                                  | Operación                                                                  | Reglas de enlace                                                                                                          |
| ------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Botón Editar                         | Acción de edición                       | —                                                                          | Cuando el status del registro es "Completed" se deshabilita automáticamente, evitando ediciones innecesarias.             |
| Botón "No cualificado" (estado activo) | "Unqualified >"                         | Actualiza el status del registro a "Unqualified".                          | Visible por defecto; si el status es "Completed", el botón se deshabilita.                                                |
| Botón "Nuevo lead" (no activo)       | Acción de update, "New >"               | Establece el status como "New" y muestra el aviso "New" tras la actualización. | Si el status del registro no es "Unqualified" se oculta. (Es decir, si el registro ya está en "New" o un estado posterior, debería estar activo.) |
| Botón "Nuevo lead" (estado activo)   | Acción de update, "New >"               | Actualiza el status del registro a "New".                                  | Cuando el status es "Unqualified" se oculta; si el status es "Completed", el botón se deshabilita.                        |
| Botón "En proceso" (no activo)       | Acción de update, "Working >"           | Actualiza el status a "Working" y muestra el aviso "Working".              | Cuando el status del registro no es "Unqualified" o "New" se oculta.                                                      |
| Botón "En proceso" (estado activo)   | Acción de update, "Working >"           | Actualiza el status del registro a "Working".                              | Cuando el status es "Unqualified" o "New" se oculta; si el status es "Completed", el botón se deshabilita.                |
| Botón "En seguimiento" (no activo)   | Acción de update, "Nurturing >"         | Establece el status como "Nurturing" y muestra el aviso "Nurturing".       | Cuando el status del registro no es "Unqualified", "New" o "Working" se oculta.                                           |
| Botón "En seguimiento" (estado activo) | Acción de update, "Nurturing >"         | Actualiza el status del registro a "Nurturing".                            | Cuando el status es "Unqualified", "New" o "Working" se oculta; si el status es "Completed", el botón se deshabilita.     |
| Botón "Convertir"                    | Acción de edición, "transfer", icono "√" | Abre el formulario de conversión; al enviar, actualiza el status del registro a "Completed". | Cuando el status del registro es "Completed" se oculta para evitar conversiones repetidas.                                |
| Botón "Conversión completada" (estado activo) | Acción de visualización, "transfered", icono "√" | Solo sirve para mostrar la información tras finalizar la conversión, sin permitir edición. | Solo se muestra cuando el status del registro es "Completed"; en otros estados permanece oculto.                          |

- Ejemplo de reglas de enlace:
  En proceso (no activo)
  ![20250311084104](https://static-docs.nocobase.com/20250311084104.png)
  En proceso (activo)
  ![20250311083953](https://static-docs.nocobase.com/20250311083953.png)
- Formulario de conversión:
  Botón Convertir (no activo)
  ![](https://static-docs.nocobase.com/20250226094223.png)
  Botón Convertir (activo)
  ![](https://static-docs.nocobase.com/20250226094203.png)
- Aviso al enviar la conversión:
  ![20250311084638](https://static-docs.nocobase.com/20250311084638.png)

### 4.3 Resumen de la configuración de los botones

- Cada función ofrece distintos estilos de botón en estado activo o no activo.
- Mediante reglas de enlace, controlamos dinámicamente la visualización de los botones (ocultar o deshabilitar) según el status del registro, guiando así al equipo comercial por el flujo de trabajo correcto.

## 5. Configuración de las reglas de enlace del formulario

### 5.1 Regla 1: mostrar solo el nombre

- Cuando el registro no está confirmado, solo se muestra el nombre.
  ![](https://static-docs.nocobase.com/20250226092629.png)
  ![](https://static-docs.nocobase.com/20250226092555.png)

### 5.2 Regla 2: optimización de la visualización en estado "Nuevo lead"

- Cuando el status sea "Nuevo lead", la página oculta el nombre de la empresa y muestra los datos de contacto.
  ![](https://static-docs.nocobase.com/20250226092726.png)

## 6. Reglas Markdown de la página y sintaxis Handlebars

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
**Recopile más información sobre este lead.**  
- Conozca las necesidades y los puntos de interés del cliente potencial  
- Recoja los datos básicos de contacto y el contexto de la empresa  
- Determine la prioridad y el método de seguimiento posterior  
{{/if}}
```

Cuando el estado es "En proceso":

```markdown
{{#if (eq $nRecord.status "En proceso")}}
**Contacte proactivamente con el lead y evalúe sus necesidades.**  
- Establezca contacto con el cliente potencial por teléfono o correo  
- Conozca los problemas y desafíos a los que se enfrenta el cliente  
- Valore preliminarmente la afinidad entre las necesidades del cliente y los productos/servicios de la empresa  
{{/if}}
```

Cuando el estado es "En seguimiento":

```markdown
{{#if (eq $nRecord.status "En seguimiento")}}
**Profundice en las necesidades del cliente y nutra el lead.**  
- Proporcione material informativo o propuestas de solución  
- Responda a las preguntas del cliente y disipe sus dudas  
- Valore la probabilidad de conversión del lead  
{{/if}}
```

Cuando el estado es "Conversión completada":

```markdown
{{#if (eq $nRecord.status "Conversión completada")}}
**El lead se ha convertido con éxito en cliente.**  
- Confirme que se han creado los registros correspondientes de empresa y contacto  
- Cree el registro de oportunidad y defina el plan de seguimiento  
- Traspase la información y el historial de comunicaciones al comercial responsable  
{{/if}}
```

## 7. Mostrar los objetos relacionados tras la conversión y los enlaces de salto

### 7.1 Notas sobre los objetos relacionados

Tras la conversión, queremos mostrar los objetos relacionados (empresa, contacto, oportunidad) y poder saltar directamente a la página de detalle.
En este momento, busque cualquier ventana emergente de detalle (por ejemplo, la de empresa) y copie el enlace.
![20250311085502](https://static-docs.nocobase.com/20250311085502.png)
Atención: en otras ventanas emergentes o páginas, la última parte del formato del enlace de detalle (el número que sigue a filterbytk) corresponde al id del objeto actual, por ejemplo:

```text
{Base URL}/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{id}
```

### 7.2 Generación de enlaces relacionados con Handlebars

Empresa:

```markdown
{{#if (eq $nRecord.status "Completado")}}
**Empresa:**
[{{$nRecord.account.name}}](w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

Contacto:

```markdown
{{#if (eq $nRecord.status "Completado")}}
**Contacto:**
[{{$nRecord.contact.name}}](1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

Oportunidad:

```markdown
{{#if (eq $nRecord.status "Completado")}}
**Oportunidad:**
[{{$nRecord.opportunity.name}}](si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
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
