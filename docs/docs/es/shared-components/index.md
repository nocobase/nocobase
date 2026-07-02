---
title: "Componentes compartidos"
description: "Componentes compartidos de NocoBase client v2: contenedores de formulario, campos, filtros, tablas e iconos."
keywords: "client-v2,shared components,React,Antd,NocoBase"
---

# Componentes compartidos

NocoBase client v2 incluye un conjunto de componentes compartidos. Al crear páginas de plugins, páginas de configuración o formularios, puedes usarlos directamente para reutilizar la UI y las interacciones ya preparadas por NocoBase.

Esta sección organiza los componentes por escenario de uso. Cada página presenta un solo componente: cuándo usarlo, su API habitual y si se puede previsualizar en la documentación.

## Índice rápido

| Quiero... | Dónde consultar |
| --- | --- |
| Controlar el escáner de pantalla completa de bajo nivel | [CodeScanner](./form/code-scanner) |
| Colocar un formulario estándar en un dialog | [DialogFormLayout](./form/dialog-form-layout) |
| Colocar un formulario estándar en un drawer | [DrawerFormLayout](./form/drawer-form-layout) |
| Permitir solo variables de entorno `$env` | [EnvVariableInput](./form/env-variable-input) |
| Introducir un tamaño de archivo y guardarlo como bytes | [FileSizeInput](./form/file-size-input) |
| Editar configuración JSON / JSON5 | [JsonTextArea](./form/json-text-area) |
| Introducir una contraseña con indicador de fortaleza | [PasswordInput](./form/password-input) |
| Cargar opciones de Select de forma asíncrona desde una API | [RemoteSelect](./form/remote-select) |
| Añadir soporte de escaneo a un input | [ScanInput](./form/scan-input) |
| Permitir que un campo acepte constantes y variables | [TypedVariableInput](./form/typed-variable-input) |
| Permitir que un campo de una línea acepte variables como `{{ $env.X }}` y `{{ $user.name }}` | [VariableInput](./form/variable-input) |
| Insertar variables en configuración JSON / JSON5 | [VariableJsonTextArea](./form/variable-json-text-area) |
| Permitir variables en texto multilínea | [VariableTextArea](./form/variable-text-area) |
| Filtrar una Collection con varias condiciones | [CollectionFilter](./filter/) |
| Incrustar un panel de filtro de Collection en una página | [CollectionFilterPanel](./filter/collection-filter-panel) |
| Personalizar la fila arrastrable de una antd Table | [SortableRow](./table/sortable-row) |
| Personalizar la columna de asa de arrastre de una Table | [SortHandle](./table/sort-handle) |
| Mostrar listas, seleccionar filas y ordenar por arrastre en páginas de configuración | [Table](./table/) |
| Usar iconos de Ant Design o registrar iconos personalizados | [Icon](./icon) |
| Crear un registro interno para extensiones del plugin | [createFormRegistry](./create-form-registry) |

## Uso

Importa los componentes que necesites en un plugin de cliente y úsalos como componentes React normales:

```tsx
import { RemoteSelect, Table } from '@nocobase/client-v2';

function SettingsPage() {
  return (
    <>
      <RemoteSelect request={loadOptions} />
      <Table rowKey="id" columns={columns} dataSource={records} />
    </>
  );
}
```

## Cuándo usarlos

Por defecto usa React + Antd. Revisa primero estos componentes en escenarios habituales de plugins de NocoBase:

- Abrir formularios en drawer o dialog en páginas de configuración
- Insertar variables, editar JSON, introducir tamaños de archivo o escanear códigos en campos de formulario
- Usar filtros de Collection o ordenación por arrastre en listas
- Usar la entrada de iconos unificada de NocoBase

Para entradas, botones y mensajes ordinarios, los componentes de Antd suelen ser más claros.

## Enlaces relacionados

- [Desarrollo de componentes](../plugin-development/client/component/index.md)
- [Context - Capacidades comunes](../plugin-development/client/ctx/common-capabilities.md)
- [FlowEngine](../flow-engine/index.md)
