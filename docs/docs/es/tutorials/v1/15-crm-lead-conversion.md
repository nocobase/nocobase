# Implementación de la conversión de leads en CRM

## 1. Introducción

Este tutorial le guiará paso a paso para implementar en NocoBase la función de conversión de oportunidades (Opportunity Conversion) del CRM. Le mostraremos cómo crear las collections (tablas de datos) necesarias, configurar las páginas de gestión de datos, diseñar el flujo de conversión y configurar la gestión de relaciones, ayudándole a construir con éxito todo el proceso de negocio.

🎉 [¡La solución CRM de NocoBase ya está disponible! Bienvenido a probarla](https://www.nocobase.com/cn/blog/crm-solution)

## 2. Preparación: crear las collections necesarias

Antes de empezar, debemos preparar las siguientes 4 collections y configurar las relaciones entre ellas.

### 2.1 LEAD Collection (leads)

Es la collection que se utiliza para almacenar información de clientes potenciales. Sus campos se definen así:


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
| status         | **Estado**         | Single select    | Estado actual del lead (No cualificado, Nuevo lead, En proceso, En seguimiento, En negociación, Cerrado) |
| Account        | **Empresa**        | Many to one      | Relacionado con la collection Empresa                                                                  |
| Contact        | **Contacto**       | Many to one      | Relacionado con la collection Contacto                                                                 |
| Opportunity    | **Oportunidad**    | Many to one      | Relacionado con la collection Oportunidad                                                              |

### 2.2 ACCOUNT Collection (empresas)

Para guardar información detallada de las empresas. Sus campos se configuran así:


| Field name | Nombre del campo | Field interface  | Description                                            |
| ---------- | ---------------- | ---------------- | ------------------------------------------------------ |
| name       | **Nombre**       | Single line text | Nombre de la cuenta (nombre de la empresa o entidad)   |
| industry   | **Sector**       | Single select    | Sector al que pertenece la cuenta                      |
| phone      | **Teléfono**     | Phone            | Teléfono de contacto de la cuenta                      |
| website    | **Web**          | URL              | Dirección web oficial de la cuenta                     |

### 2.3 CONTACT Collection (contactos)

Collection para almacenar información de contactos. Contiene los siguientes campos:


| Field name | Nombre del campo | Field interface  | Description                              |
| ---------- | ---------------- | ---------------- | ---------------------------------------- |
| name       | **Nombre**       | Single line text | Nombre del contacto                      |
| email      | **Correo**       | Email            | Dirección de correo electrónico          |
| phone      | **Teléfono**     | Phone            | Teléfono de contacto                     |

### 2.4 OPPORTUNITY Collection (oportunidades)

Para registrar información sobre oportunidades. Sus campos se definen así:


| Field name | Nombre del campo  | Field interface  | Description                                                                                |
| ---------- | ----------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| name       | **Nombre**        | Single line text | Nombre de la oportunidad                                                                   |
| stage      | **Fase**          | Single select    | Fase de la oportunidad (Cualificación, Necesidades, Propuesta, Negociación, Cierre, Ganada, Perdida) |
| amount     | **Importe**       | Number           | Importe de la oportunidad                                                                  |
| close_date | **Fecha de cierre**| Datetime         | Fecha estimada de cierre de la oportunidad                                                 |

## 3. Comprender el flujo de conversión de oportunidades

### 3.1 Descripción del flujo de conversión normal

Una oportunidad pasa generalmente por el siguiente flujo desde que es un lead hasta que se convierte en una oportunidad formal:

![20250225211802](https://static-docs.nocobase.com/20250225211802.png)

### 3.2 Explicación de las relaciones

Suponiendo que ya ha creado correctamente las 4 collections anteriores y configurado el mapeo entre ellas:

![Relaciones](https://static-docs.nocobase.com/20250225090913.png)

## 4. Crear las páginas de gestión de datos

En el espacio de trabajo de NocoBase, cree páginas de gestión de datos para cada collection y añada algunos leads aleatoriamente para realizar pruebas posteriormente.

![Página de gestión de datos](https://static-docs.nocobase.com/20250224234721.png)

## 5. Implementar la función de conversión de oportunidades

Esta sección se centra en cómo convertir un lead en datos de empresa, contacto y oportunidad, y en garantizar que la operación de conversión no se active más de una vez.

### 5.1 Crear la operación de edición "Convertir"

En la pantalla de detalles del lead correspondiente, cree una operación de edición llamada "Convertir". En la ventana emergente de conversión, haga la siguiente configuración:

#### 5.1.1 Mostrar la información básica del lead

Muestre la información básica del lead actual en modo de solo lectura, para asegurar que el usuario no modifique los datos originales por error.

#### 5.1.2 Mostrar los campos de relaciones

Muestre los siguientes tres campos relacionales en la ventana emergente y active "Creación rápida" para cada uno, de modo que se puedan crear nuevos datos al instante si no se encuentra una coincidencia.

![Mostrar campos relacionales](https://static-docs.nocobase.com/20250224234155.png)

#### 5.1.3 Configurar el mapeo predeterminado de "Creación rápida"

En la configuración de la ventana emergente "Creación rápida", configure los valores predeterminados de cada campo relacional para que la información del lead se mapee automáticamente a la collection objetivo. Las reglas de mapeo son:

- Lead/Nombre del lead → Empresa/Nombre
- Lead/Correo → Empresa/Correo
- Lead/Teléfono → Empresa/Teléfono
- Lead/Nombre del lead → Contacto/Nombre
- Lead/Correo → Contacto/Correo
- Lead/Teléfono → Contacto/Teléfono
- Lead/Nombre del lead → Oportunidad/Nombre
- Lead/Estado → Oportunidad/Fase

Captura de ejemplo:

![Mapeo predeterminado 1](https://static-docs.nocobase.com/20250225000218.png)

A continuación, añadiremos un mensaje de confirmación amistoso a la operación de envío:
![20250226154935](https://static-docs.nocobase.com/20250226154935.png)
![20250226154952](https://static-docs.nocobase.com/20250226154952.png)

Resultado del envío:
![Mapeo predeterminado 2](https://static-docs.nocobase.com/20250225001256.png)

#### 5.1.4 Comprobar el efecto de la conversión

Una vez configurado, al ejecutar la operación de conversión el sistema creará y vinculará nuevos datos de empresa, contacto y oportunidad de acuerdo con las reglas de mapeo. Ejemplo del resultado:

![](https://static-docs.nocobase.com/202502252130-transfer1.gif)
![](https://static-docs.nocobase.com/202502252130-transfer2.gif)

### 5.2 Evitar conversiones repetidas

Para evitar que un mismo lead sea convertido varias veces, podemos controlarlo de las siguientes maneras:

#### 5.2.1 Actualizar el estado del lead

En la operación de envío del formulario de conversión, añada un paso de actualización automática de datos para cambiar el estado del lead a "Convertido".

Capturas de configuración:

![Actualizar estado 1](https://static-docs.nocobase.com/20250225001758.png)
![Actualizar estado 2](https://static-docs.nocobase.com/20250225001817.png)
Demostración del resultado:
![202502252130-transfer](https://static-docs.nocobase.com/202502252130-transfer.gif)

#### 5.2.2 Configurar las reglas de enlace del botón

Añada una regla de enlace al botón de conversión: cuando el estado del lead sea "Convertido", el botón se ocultará automáticamente, evitando así operaciones repetidas.

Capturas de configuración:

![Enlace de botón 1](https://static-docs.nocobase.com/20250225001838.png)
![Enlace de botón 2](https://static-docs.nocobase.com/20250225001939.png)
![Enlace de botón 3](https://static-docs.nocobase.com/20250225002026.png)

## 6. Configurar el bloque de gestión de relaciones en las páginas de detalle

Para que los usuarios puedan ver los datos relacionados en las páginas de detalle de cada Collection, debe configurar bloques de tipo lista o detalle correspondientes.

### 6.1 Configurar la página de detalle de la Collection Empresa

En la página de detalle de la empresa (por ejemplo, en la ventana de edición/detalle del contacto), añada los siguientes bloques de tipo lista:

- list de Contactos
- list de Oportunidades
- list de Leads

Capturas de ejemplo:

![Página de detalle de empresa](https://static-docs.nocobase.com/20250225085418.png)

### 6.2 Añadir filtros

Añada reglas de filtrado a cada bloque de tipo lista para asegurar que solo se muestran los datos asociados al ID de la empresa actual.

Capturas de configuración:

![Filtros 1](https://static-docs.nocobase.com/20250225085513.png)
![Filtros 2](https://static-docs.nocobase.com/20250225085638.png)

### 6.3 Configurar las páginas de detalle de Contacto y Oportunidad

En la ventana emergente de detalle de la Collection Contacto añada los siguientes bloques:

- list de Oportunidades
- detalle de Empresa
- list de Leads (filtrado por ID)

Capturas:

![Detalle de contacto](https://static-docs.nocobase.com/20250225090231.png)

En la página de detalle de Oportunidad añada también:

- list de Contactos
- detalle de Empresa
- list de Leads (filtrado por ID)

Capturas:

![Detalle de oportunidad](https://static-docs.nocobase.com/20250225091208.png)

## 7. Resumen

Mediante los pasos anteriores, ha implementado con éxito una sencilla función de conversión de oportunidades en CRM y configurado la gestión de relaciones entre contactos, empresas y leads. Esperamos que este tutorial le haya ayudado, de manera clara y progresiva, a dominar la construcción del proceso completo, brindando comodidad y eficiencia operativa a sus proyectos.

---

Si encuentra algún problema durante el proceso, le invitamos a participar en la [Comunidad de NocoBase](https://forum.nocobase.com) o consultar la [documentación oficial](https://docs-cn.nocobase.com). Esperamos que esta guía le ayude a implementar con éxito la revisión de registro de usuarios según sus necesidades reales y a ampliarla con flexibilidad. ¡Le deseamos éxito en su uso y en su proyecto!
