---

pkg: '@nocobase/plugin-action-duplicate'

---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/interface-builder/actions/types/duplicate).
:::

# Duplicar

## Introducción

La acción Duplicar permite a los usuarios crear rápidamente nuevos registros basados en datos existentes. Admite dos modos de duplicación: **Duplicación directa** y **Duplicar en el formulario y continuar completando**.

## Instalación

Es un plugin integrado, no se requiere instalación adicional.

## Modo de duplicación

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Duplicación directa

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Se ejecuta como «Duplicación directa» de forma predeterminada;
- **Campos de plantilla**: especifique los campos que se duplicarán. Se permite «Seleccionar todo». Es una configuración obligatoria.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Una vez configurado, haga clic en el botón para duplicar los datos.

### Duplicar en el formulario y continuar completando

Los campos de plantilla configurados se completarán en el formulario como **valores predeterminados**. Los usuarios pueden modificar estos valores antes de enviarlos para completar la duplicación.

![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Configurar campos de plantilla**: solo los campos seleccionados se transferirán como valores predeterminados.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Sincronizar campos del formulario

- Analiza automáticamente los campos ya configurados en el bloque de formulario actual como campos de plantilla;
- Si los campos del bloque de formulario se modifican posteriormente (por ejemplo, ajustando los componentes de los campos de relación), debe abrir nuevamente la configuración de la plantilla y hacer clic en **Sincronizar campos del formulario** para garantizar la coherencia.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

Los datos de la plantilla se completarán como valores predeterminados del formulario, y los usuarios pueden enviarlos tras su modificación para completar la duplicación.


### Notas adicionales

#### Duplicar, Referenciar, Precargar

Los diferentes tipos de campos (tipos de relación) tienen diferentes lógicas de procesamiento: **Duplicar / Referenciar / Precargar**. El **componente de campo** de un campo de relación también afecta a esta lógica:

- Selector / Selector de registros: se utiliza para **Referenciar**
- Subformulario / Subtabla: se utiliza para **Duplicar**

**Duplicar**

- Los campos normales se duplican;
- `hasOne` / `hasMany` solo pueden duplicarse (este tipo de relaciones no deben usar componentes de selección como el selector desplegable o el selector de registros; en su lugar, deben usarse componentes de subformulario o subtabla);
- El cambio de componente para `hasOne` / `hasMany` **no** cambiará la lógica de procesamiento (sigue siendo Duplicar);
- Para los campos de relación duplicados, se pueden seleccionar todos los subcampos.

**Referenciar**

- `belongsTo` / `belongsToMany` se tratan como Referencia;
- Si el componente de campo se cambia de «Selector desplegable» a «Subformulario», la relación cambia de **Referencia a Duplicar** (una vez que se convierte en Duplicar, todos los subcampos pasan a ser seleccionables).

**Precargar**

- Los campos de relación bajo un campo de Referencia se tratan como Precarga;
- Los campos de precarga pueden convertirse en Referencia o Duplicar después de un cambio de componente.

#### Seleccionar todo

- Selecciona todos los **campos de duplicación** y **campos de referencia**.

#### Los siguientes campos se filtrarán del registro seleccionado como plantilla de datos:

- Se filtran las claves primarias de los datos de relación duplicados; las claves primarias para Referencia y Precarga no se filtran;
- Claves foráneas;
- Campos que no permiten duplicados (únicos);
- Campos de ordenación;
- Campos de codificación automática (secuencia);
- Contraseña;
- Creado por, Fecha de creación;
- Última actualización por, Fecha de última actualización.

#### Sincronizar campos del formulario

- Analiza automáticamente los campos configurados en el bloque de formulario actual como campos de plantilla;
- Después de modificar los campos del bloque de formulario (por ejemplo, ajustando los componentes de los campos de relación), debe sincronizar nuevamente para garantizar la coherencia.