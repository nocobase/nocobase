---
pkg: "@nocobase/plugin-action-import"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Importar

## Introducción

Permite importar datos utilizando una plantilla de Excel. Puede configurar qué campos desea importar y la plantilla se generará automáticamente.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Instrucciones de Importación

### Campos de Tipo Numérico

Admite números y porcentajes. El texto como `N/A` o `-` se filtrará.

| Número 1 | Porcentaje | Número 2 | Número 3 |
| -------- | ---------- | -------- | -------- |
| 123      | 25%        | N/A      | -        |

Después de la conversión a JSON:

```ts
{
  "Número 1": 123,
  "Porcentaje": 0.25,
  "Número 2": null,
  "Número 3": null,
}
```

### Campos de Tipo Booleano

El texto de entrada admitido (el inglés no distingue entre mayúsculas y minúsculas) es:

- `Yes`, `Y`, `True`, `1`, `是`
- `No`, `N`, `False`, `0`, `否`

| Campo 1 | Campo 2 | Campo 3 | Campo 4 | Campo 5 |
| ------- | ------- | ------- | ------- | ------- |
| No      | Yes     | Y       | true    | 0       |

Después de la conversión a JSON:

```ts
{
  "Campo 1": false,
  "Campo 2": true,
  "Campo 3": true,
  "Campo 4": true,
  "Campo 5": false,
}
```

### Campos de Tipo Fecha

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

Después de la conversión a JSON:

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z",
}
```

### Campos de Tipo Selección

Tanto los valores de las opciones como las etiquetas de las opciones pueden utilizarse como texto de importación. Varias opciones se separan con comas (`,` `，`) o con el signo de pausa (`、`).

Por ejemplo, las opciones para el campo `Prioridad` incluyen:

| Valor de la opción | Etiqueta de la opción |
| ------------------ | --------------------- |
| low                | Baja                  |
| medium             | Media                 |
| high               | Alta                  |

Tanto los valores de las opciones como las etiquetas de las opciones pueden utilizarse como texto de importación.

| Prioridad |
| --------- |
| Alta      |
| low       |

Después de la conversión a JSON:

```ts
[{ Prioridad: 'high' }, { Prioridad: 'low' }];
```

### Campos de División Administrativa de China

| Región 1        | Región 2        |
| --------------- | --------------- |
| 北京市/市辖区 | 天津市/市辖区 |

Después de la conversión a JSON:

```ts
{
  "Región 1": ["11","1101"],
  "Región 2": ["12","1201"]
}
```

### Campos de Archivo Adjunto

| Archivo Adjunto                          |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

Después de la conversión a JSON:

```ts
{
  "Archivo Adjunto": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### Campos de Tipo Relación

Múltiples entradas de datos se separan con comas (`,` `，`) o con el signo de pausa (`、`).

| Departamento/Nombre | Categoría/Título     |
| ------------------- | -------------------- |
| Equipo de Desarrollo | Categoría 1, Categoría 2 |

Después de la conversión a JSON:

```ts
{
  "Departamento": [1], // 1 es el ID de registro para el departamento llamado "Equipo de Desarrollo"
  "Categoría": [1,2], // 1,2 son los IDs de registro para las categorías tituladas "Categoría 1" y "Categoría 2"
}
```

### Campos de Tipo JSON

| JSON1           |
| --------------- |
| {"key":"value"} |

Después de la conversión a JSON:

```ts
{
  "JSON": {"key":"value"}
}
```

### Tipos de Geometría de Mapa

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

Después de la conversión a JSON:

```ts
{
  "Point": [1,2],
  "Line": [[1,2], [3,4]],
  "Polygon": [[1,2], [3,4], [1,2]],
  "Circle": [1,2,3]
}
```

## Formato de Importación Personalizado

Registre un `ValueParser` personalizado a través del método `db.registerFieldValueParsers()`, por ejemplo:

```ts
import { BaseValueParser } from '@nocobase/database';

class PointValueParser extends BaseValueParser {
  async setValue(value) {
    if (Array.isArray(value)) {
      this.value = value;
    } else if (typeof value === 'string') {
      this.value = value.split(',');
    } else {
      this.errors.push('Value invalid');
    }
  }
}

const db = new Database();

// Al importar un campo de tipo `point`, los datos serán analizados por `PointValueParser`.
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Ejemplo de Importación

| Point |
| ----- |
| 1,2   |

Después de la conversión a JSON:

```ts
{
  "Point": [1,2]
}
```

## Configuración de la Acción

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- Configure los campos importables

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Reglas de Enlace](/interface-builder/actions/action-settings/linkage-rule): Muestre u oculte el botón dinámicamente;
- [Editar Botón](/interface-builder/actions/action-settings/edit-button): Edite el título, el tipo y el icono del botón;