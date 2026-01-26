:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Desenvolvimento de Extensões

## Estendendo Motores de Armazenamento

### Lado do Servidor

1.  **Herde `StorageType`**
    
    Crie uma nova classe e implemente os métodos `make()` e `delete()`, e, se necessário, sobrescreva os hooks como `getFileURL()`, `getFileStream()` e `getFileData()`.

Exemplo:

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

4.  **Registre o novo tipo**  
    Injete a nova implementação de armazenamento no ciclo de vida `beforeLoad` ou `load` do plugin:

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

Após o registro, a configuração de armazenamento aparecerá no recurso `storages`, assim como os tipos integrados. A configuração fornecida por `StorageType.defaults()` pode ser usada para preencher formulários automaticamente ou inicializar registros padrão.

### Configuração do Lado do Cliente e Interface de Gerenciamento
No lado do cliente, você precisa informar ao gerenciador de arquivos como renderizar o formulário de configuração e se existe uma lógica de upload personalizada. Cada objeto de tipo de armazenamento contém as seguintes propriedades:

## Estendendo Tipos de Arquivo do Frontend

Para arquivos já enviados, você pode exibir diferentes conteúdos de pré-visualização na interface do frontend com base em diferentes tipos de arquivo. O campo de anexo do gerenciador de arquivos possui uma pré-visualização de arquivo integrada baseada no navegador (incorporada em um iframe), que suporta a pré-visualização da maioria dos formatos de arquivo (como imagens, vídeos, áudios e PDFs) diretamente no navegador. Quando um formato de arquivo não é suportado pelo navegador para pré-visualização, ou quando interações de pré-visualização especiais são necessárias, você pode estender o componente de pré-visualização baseado no tipo de arquivo.

### Exemplo

Por exemplo, para estender um tipo de arquivo de imagem com um componente de carrossel, você pode usar o seguinte código:

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

Aqui, `attachmentFileTypes` é o objeto de entrada fornecido no pacote `@nocobase/client` para estender tipos de arquivo. Use o método `add` dele para estender um objeto de descrição de tipo de arquivo.

Cada tipo de arquivo deve implementar um método `match()` para verificar se o tipo de arquivo atende aos requisitos. No exemplo, o método fornecido pelo pacote `mime-match` é usado para verificar o atributo `mimetype` do arquivo. Se ele corresponder ao tipo `image/*`, é considerado o tipo de arquivo a ser processado. Se nenhuma correspondência for encontrada, ele retornará ao tratamento de tipo integrado.

A propriedade `Previewer` no objeto de descrição de tipo é o componente usado para pré-visualização. Quando o tipo de arquivo corresponde, este componente será renderizado para pré-visualização. Geralmente, é recomendado usar um componente do tipo diálogo (como `<Modal />`) como contêiner base e, em seguida, colocar o conteúdo de pré-visualização e interativo dentro dele para implementar a funcionalidade de pré-visualização.

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

`attachmentFileTypes` é uma instância global, importada de `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registra um novo objeto de descrição de tipo de arquivo no registro de tipos de arquivo. O tipo do objeto de descrição é `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Método de correspondência de formato de arquivo.

O parâmetro de entrada `file` é o objeto de dados de um arquivo enviado, contendo propriedades relevantes que podem ser usadas para verificação de tipo:

*   `mimetype`: descrição do mimetype
*   `extname`: extensão do arquivo, incluindo o "."
*   `path`: caminho de armazenamento relativo do arquivo
*   `url`: URL do arquivo

Retorna um valor `boolean` indicando se há correspondência.

##### `Previewer`

Um componente React para pré-visualizar arquivos.

As Props de entrada são:

*   `index`: O índice do arquivo na lista de anexos
*   `list`: A lista de anexos
*   `onSwitchIndex`: Um método para alternar o índice

O `onSwitchIndex` pode receber qualquer índice da lista para alternar para outro arquivo. Se `null` for passado como argumento, o componente de pré-visualização será fechado diretamente.

```ts
onSwitchIndex(null);
```