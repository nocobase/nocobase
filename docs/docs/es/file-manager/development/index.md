:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Desarrollo de Extensiones

## Extender motores de almacenamiento

### Lado del servidor

1. **Heredar `StorageType`**
   
   Cree una nueva clase e implemente los métodos `make()` y `delete()`. Si es necesario, sobrescriba hooks como `getFileURL()`, `getFileStream()` y `getFileData()`.

Ejemplo:

```ts
// packages/my-plugin/src/server/storages/custom.ts
import { AttachmentModel, StorageModel, StorageType } from '@nocobase/plugin-file-manager';
import type { StorageEngine } from 'multer';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

export class CustomStorageType extends StorageType {
  make(): StorageEngine {
    return multer.diskStorage({
      destination: path.resolve('custom-uploads'),
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });
  }

  async delete(records: AttachmentModel[]) {
    let deleted = 0;
    const failures: AttachmentModel[] = [];
    for (const record of records) {
      try {
        await fs.unlink(path.resolve('custom-uploads', record.path || '', record.filename));
        deleted += 1;
      } catch (error) {
        failures.push(record);
      }
    }
    return [deleted, failures];
  }
}
```

4. **Registrar el nuevo tipo**  
   Inyecte la nueva implementación de almacenamiento en el ciclo de vida `beforeLoad` o `load` del plugin:

```ts
// packages/my-plugin/src/server/plugin.ts
import { Plugin } from '@nocobase/server';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { CustomStorageType } from './storages/custom';

export default class MyStoragePluginServer extends Plugin {
  async load() {
    const fileManager = this.app.pm.get(PluginFileManagerServer);
    fileManager.registerStorageType('custom-storage', CustomStorageType);
  }
}
```

Después de registrarlo, la configuración de almacenamiento aparecerá en el recurso `storages`, igual que los tipos integrados. La configuración proporcionada por `StorageType.defaults()` se puede usar para autocompletar formularios o inicializar registros predeterminados.

<!--
### Configuración del lado del cliente e interfaz de administración
En el lado del cliente, debe informar al gestor de archivos cómo renderizar el formulario de configuración y si existe lógica de carga personalizada. Cada objeto de tipo de almacenamiento contiene las siguientes propiedades:
-->

## Extender tipos de archivo en el frontend

Para los archivos ya cargados, puede mostrar distintos contenidos de vista previa en la interfaz según el tipo de archivo. El campo de adjuntos del gestor de archivos incluye una vista previa integrada basada en el navegador (incrustada en un iframe), que permite previsualizar la mayoría de los formatos (como imágenes, videos, audio y PDF) directamente en el navegador. Cuando un formato no está soportado por el navegador o se requieren interacciones especiales de vista previa, puede extender el componente de vista previa por tipo de archivo.

### Ejemplo

Por ejemplo, si desea integrar una vista previa en línea personalizada para archivos Office, puede usar el siguiente código:

```tsx
import React, { useMemo } from 'react';
import { Plugin, matchMimetype } from '@nocobase/client';
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';

class MyPlugin extends Plugin {
  load() {
    filePreviewTypes.add({
      match(file) {
        return matchMimetype(file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      },
      Previewer({ file }) {
        const url = useMemo(() => {
          const src =
            file.url.startsWith('https://') || file.url.startsWith('http://')
              ? file.url
              : `${location.origin}/${file.url.replace(/^\//, '')}`;
          const u = new URL('https://view.officeapps.live.com/op/embed.aspx');
          u.searchParams.set('src', src);
          return u.href;
        }, [file.url]);
        return <iframe src={url} width="100%" height="600px" style={{ border: 'none' }} />;
      },
    });
  }
}
```

Aquí, `filePreviewTypes` es el objeto de entrada proporcionado por `@nocobase/plugin-file-manager/client` para extender las vistas previas de archivos. Use su método `add` para añadir un descriptor de tipo de archivo.

Cada tipo de archivo debe implementar un método `match()` para comprobar si cumple los requisitos. En el ejemplo, se usa `matchMimetype` para verificar el atributo `mimetype` del archivo. Si coincide con el tipo `docx`, se considera el tipo a manejar. Si no coincide, se utilizará el manejo de tipos integrado.

La propiedad `Previewer` del descriptor de tipo es el componente usado para la vista previa. Cuando el tipo coincide, se renderiza este componente en el cuadro de vista previa. Puede devolver cualquier vista React (como un iframe, un reproductor o un gráfico).

### API

```ts
export interface FilePreviewerProps {
  file: any;
  index: number;
  list: any[];
}

export interface FilePreviewType {
  match(file: any): boolean;
  getThumbnailURL?: (file: any) => string | null;
  Previewer?: React.ComponentType<FilePreviewerProps>;
}

export class FilePreviewTypes {
  add(type: FilePreviewType): void;
}
```

#### `filePreviewTypes`

`filePreviewTypes` es una instancia global, importada desde `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Registra un nuevo descriptor de tipo de archivo en el registro. El tipo del descriptor es `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Método de coincidencia de formato de archivo.

El parámetro de entrada `file` es el objeto de datos de un archivo subido, que contiene propiedades relevantes para la comprobación del tipo:

* `mimetype`: descripción del mimetype
* `extname`: extensión del archivo, incluida la "."
* `path`: ruta de almacenamiento relativa del archivo
* `url`: URL del archivo

Devuelve un `boolean` que indica si coincide.

##### `getThumbnailURL`

Devuelve la URL de la miniatura usada en la lista de archivos. Si el valor es vacío, se usará la imagen de marcador de posición integrada.

##### `Previewer`

Un componente React para la vista previa de archivos.

Las props de entrada son:

* `file`: el objeto de archivo actual (puede ser una URL en string o un objeto que contiene `url`/`preview`)
* `index`: índice del archivo en la lista
* `list`: lista de archivos

