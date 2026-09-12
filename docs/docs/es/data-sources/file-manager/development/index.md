---
title: "Desarrollo de extensiones del gestor de archivos"
description: "Extender el componente de vista previa de tipos de archivo, el campo de archivos adjuntos y la lógica de carga mediante las API attachmentFileTypes, mime-match, etc."
keywords: "extensión del gestor de archivos, extensión del campo de archivos adjuntos, extensión de vista previa de archivos, attachmentFileTypes,NocoBase"
---

# Desarrollo de extensiones

## Extender los tipos de archivo en el frontend

Para los archivos que ya se han cargado, se puede mostrar un contenido de vista previa diferente en la interfaz según el tipo de archivo. El campo de archivos adjuntos del gestor de archivos incluye una vista previa basada en el navegador (incrustada en un iframe), que admite la vista previa directa en el navegador de la mayoría de los formatos de archivo (imágenes, vídeos, audio y PDF, entre otros). Cuando el formato no es compatible con la vista previa del navegador o se necesita una interacción de vista previa especial, se puede implementar mediante la extensión de componentes de vista previa basados en el tipo de archivo.

### Ejemplo

Por ejemplo, si se desea extender el tipo de archivo de imagen con un componente de carrusel, se puede hacer mediante el siguiente código:

```ts
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

Aquí, `attachmentFileTypes` es el objeto de entrada para extender los tipos de archivo proporcionado por el paquete `@nocobase/client`, que utiliza el método `add` proporcionado para extender un objeto de descripción de tipo de archivo.

Cada tipo de archivo debe implementar un método `match()` para comprobar si cumple los requisitos del tipo de archivo. En el ejemplo, se utiliza el método proporcionado por el paquete `mime-match` para comprobar la propiedad `mimetype` del archivo. Si coincide con el tipo `image/*`, se considera que es el tipo de archivo que debe procesarse. Si no se produce ninguna coincidencia, se recurre al procesamiento de tipos integrado.

La propiedad `Previewer` del objeto de descripción del tipo es el componente utilizado para la vista previa. Cuando el tipo de archivo coincide, se renderiza este componente para mostrar la vista previa. Por lo general, se recomienda utilizar un componente de tipo ventana emergente como contenedor base (por ejemplo, `<Modal />`) y colocar dentro de él la vista previa y el contenido interactivo necesario para implementar la funcionalidad de vista previa.

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

`attachmentFileTypes` es una instancia global que se importa mediante `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registra un nuevo objeto de descripción de tipo de archivo en el registro de tipos de archivo. El tipo del objeto de descripción es `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Método de coincidencia del formato de archivo.

El parámetro `file` es el objeto de datos del archivo cargado e incluye las siguientes propiedades, que pueden utilizarse para determinar el tipo:

* `mimetype`: descripción del mimetype
* `extname`: extensión del archivo, incluido “.”
* `path`: ruta relativa donde se almacena el archivo
* `url`: URL del archivo

El valor devuelto es de tipo `boolean` e indica si se ha producido una coincidencia.

##### `Previewer`

Componente React utilizado para mostrar la vista previa del archivo.

Los parámetros de Props son:

* `index`: índice del archivo en la lista de archivos adjuntos
* `list`: lista de archivos adjuntos
* `onSwitchIndex`: método utilizado para cambiar el índice

`onSwitchIndex` puede recibir cualquier valor de índice de una lista para cambiar a otro archivo. Si se utiliza `null` como parámetro de cambio, el componente de vista previa se cierra directamente.

```ts
onSwitchIndex(null);
```
