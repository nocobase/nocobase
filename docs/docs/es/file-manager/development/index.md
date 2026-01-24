:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Desarrollo de Extensiones

## Extensión de Motores de Almacenamiento

### Lado del Servidor

1.  **Heredar de `StorageType`**

    Cree una nueva clase e implemente los métodos `make()` y `delete()`. Si es necesario, sobrescriba los *hooks* como `getFileURL()`, `getFileStream()` y `getFileData()`.

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

4.  **Registrar el nuevo tipo**
    Inyecte la nueva implementación de almacenamiento en el ciclo de vida `beforeLoad` o `load` del *plugin*:

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

Una vez registrado, la configuración de almacenamiento aparecerá en el recurso `storages`, al igual que los tipos integrados. La configuración proporcionada por `StorageType.defaults()` se puede usar para autocompletar formularios o inicializar registros predeterminados.

### Configuración del Lado del Cliente e Interfaz de Gestión
En el lado del cliente, es necesario informar al gestor de archivos cómo renderizar el formulario de configuración y si existe una lógica de carga personalizada. Cada objeto de tipo de almacenamiento contiene las siguientes propiedades:

## Extensión de Tipos de Archivo para el Frontend

Para los archivos ya cargados, la interfaz del *frontend* puede mostrar diferentes contenidos de vista previa según el tipo de archivo. El campo de adjuntos del gestor de archivos incluye una vista previa de archivos basada en el navegador (incrustada en un *iframe*), que permite previsualizar la mayoría de los formatos de archivo (como imágenes, videos, audio y PDF) directamente en el navegador. Cuando un formato de archivo no es compatible con la vista previa del navegador, o cuando se requieren interacciones de vista previa especiales, puede lograrlo extendiendo el componente de vista previa basado en el tipo de archivo.

### Ejemplo

Por ejemplo, si desea extender un tipo de archivo de imagen con un componente de carrusel, puede hacerlo con el siguiente código:

```tsx
import React, { useCallback } from 'react';
import match from 'mime-match';
import { Plugin, attachmentFileTypes } from '@nocobase/client';

class MyPlugin extends Plugin {
  load() {
    attachmentFileTypes.add({
      match(file) {
        return match(file.mimetype, 'image/*');
      },
      Previewer({ index, list, onSwitchIndex }) {
        const onDownload = useCallback(
          (e) => {
            e.preventDefault();
            const file = list[index];
            saveAs(file.url, `${file.title}${file.extname}`);
          },
          [index, list],
        );
        return (
          <LightBox
            // discourageDownloads={true}
            mainSrc={list[index]?.url}
            nextSrc={list[(index + 1) % list.length]?.url}
            prevSrc={list[(index + list.length - 1) % list.length]?.url}
            onCloseRequest={() => onSwitchIndex(null)}
            onMovePrevRequest={() => onSwitchIndex((index + list.length - 1) % list.length)}
            onMoveNextRequest={() => onSwitchIndex((index + 1) % list.length)}
            imageTitle={list[index]?.title}
            toolbarButtons={[
              <button
                key={'preview-img'}
                style={{ fontSize: 22, background: 'none', lineHeight: 1 }}
                type="button"
                aria-label="Download"
                title="Download"
                className="ril-zoom-in ril__toolbarItemChild ril__builtinButton"
                onClick={onDownload}
              >
                <DownloadOutlined />
              </button>,
            ]}
          />
        );
      },
    });
  }
}
```

Aquí, `attachmentFileTypes` es el objeto de entrada proporcionado en el paquete `@nocobase/client` para extender los tipos de archivo. Utilice su método `add` para extender un objeto de descripción de tipo de archivo.

Cada tipo de archivo debe implementar un método `match()` para verificar si el tipo de archivo cumple con los requisitos. En el ejemplo, el método proporcionado por el paquete `mime-match` se utiliza para verificar el atributo `mimetype` del archivo. Si coincide con el tipo `image/*`, se considera el tipo de archivo a procesar. Si no se encuentra una coincidencia, se recurrirá al manejo de tipo integrado.

La propiedad `Previewer` en el objeto de descripción de tipo es el componente utilizado para la vista previa. Cuando el tipo de archivo coincide, este componente se renderizará para la vista previa. Generalmente, se recomienda usar un componente de tipo diálogo (como `<Modal />`) como contenedor base, y luego colocar el contenido de la vista previa y las interacciones necesarias dentro de este componente para implementar la funcionalidad de vista previa.

### API

```ts
export interface FileModel {
  id: number;
  filename: string;
  path: string;
  title: string;
  url: string;
  extname: string;
  size: number;
  mimetype: string;
}

export interface PreviewerProps {
  index: number;
  list: FileModel[];
  onSwitchIndex(index): void;
}

export interface AttachmentFileType {
  match(file: any): boolean;
  Previewer?: React.ComponentType<PreviewerProps>;
}

export class AttachmentFileTypes {
  add(type: AttachmentFileType): void;
}
```

#### `attachmentFileTypes`

`attachmentFileTypes` es una instancia global, importada desde `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registra un nuevo objeto de descripción de tipo de archivo en el registro de tipos de archivo. El tipo del objeto de descripción es `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Método de coincidencia de formato de archivo.

El parámetro de entrada `file` es el objeto de datos de un archivo cargado, que contiene propiedades relevantes que se pueden usar para la verificación de tipo:

*   `mimetype`: descripción del *mimetype*
*   `extname`: extensión del archivo, incluyendo el "."
*   `path`: ruta de almacenamiento relativa del archivo
*   `url`: URL del archivo

Devuelve un valor de tipo `boolean`, indicando si hay una coincidencia.

##### `Previewer`

Un componente React para previsualizar archivos.

Los parámetros de *Props* de entrada son:

*   `index`: El índice del archivo en la lista de adjuntos
*   `list`: La lista de adjuntos
*   `onSwitchIndex`: Un método para cambiar el índice

El método `onSwitchIndex` puede recibir cualquier valor de índice de la lista para cambiar a otro archivo. Si se pasa `null` como argumento, el componente de vista previa se cerrará directamente.

```ts
onSwitchIndex(null);
```