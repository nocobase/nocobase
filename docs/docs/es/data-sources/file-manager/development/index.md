:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Desarrollo de extensiones

## Extensión de tipos de archivo en el frontend

Para los archivos ya subidos, la interfaz de usuario del frontend puede mostrar diferentes vistas previas según el tipo de archivo. El campo de adjuntos del gestor de archivos incluye una vista previa de archivos integrada basada en el navegador (incrustada en un iframe), que permite previsualizar directamente en el navegador la mayoría de los formatos de archivo (como imágenes, vídeos, audio y PDF). Cuando un formato de archivo no es compatible con la vista previa del navegador, o si se necesita una interacción de vista previa especial, puede extender los componentes de vista previa basados en el tipo de archivo.

### Ejemplo

Por ejemplo, si desea extender un componente de carrusel para archivos de imagen, puede usar el siguiente código:

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

`attachmentFileTypes` es un objeto de entrada proporcionado por el paquete `@nocobase/client` para extender los tipos de archivo. Puede usar su método `add` para extender un descriptor de tipo de archivo.

Cada tipo de archivo debe implementar un método `match()` para verificar si el tipo de archivo cumple con los requisitos. En el ejemplo, se utiliza el paquete `mime-match` para comprobar el atributo `mimetype` del archivo. Si coincide con el tipo `image/*`, se considera un tipo de archivo que necesita procesamiento. Si no coincide, se recurrirá al manejo de tipo incorporado.

La propiedad `Previewer` en el descriptor de tipo es el componente utilizado para la vista previa. Cuando el tipo de archivo coincide, este componente se renderizará para la vista previa. Generalmente, se recomienda usar un componente de tipo modal (como `<Modal />`) como contenedor base y luego colocar el contenido de la vista previa y la interacción necesaria dentro de ese componente para implementar la funcionalidad de vista previa.

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

`attachmentFileTypes` es una instancia global que se importa desde el paquete `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registra un nuevo descriptor de tipo de archivo en el registro de tipos de archivo. El tipo del objeto descriptor es `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Método para la coincidencia de formatos de archivo.

El parámetro `file` es un objeto de datos para el archivo subido, que contiene propiedades que se pueden usar para la verificación de tipo:

*   `mimetype`: El tipo MIME del archivo.
*   `extname`: La extensión del archivo, incluyendo el ".".
*   `path`: La ruta de almacenamiento relativa del archivo.
*   `url`: La URL del archivo.

Devuelve un valor de tipo `boolean` que indica si el archivo coincide.

##### `Previewer`

Un componente de React para previsualizar el archivo.

Los parámetros de Props son:

*   `index`: El índice del archivo en la lista de adjuntos.
*   `list`: La lista de adjuntos.
*   `onSwitchIndex`: Una función para cambiar el archivo previsualizado por su índice.

La función `onSwitchIndex` puede ser llamada con cualquier valor de índice de la `list` para cambiar a otro archivo. Si se usa `null` como parámetro para el cambio, el componente de vista previa se cerrará directamente.

```ts
onSwitchIndex(null);
```