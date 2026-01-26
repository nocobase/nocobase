:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Desenvolvimento de Extensões

## Estendendo motores de armazenamento

### Lado do servidor

1. **Herda `StorageType`**
   
   Crie uma nova classe e implemente os métodos `make()` e `delete()`. Se necessário, sobrescreva hooks como `getFileURL()`, `getFileStream()` e `getFileData()`.

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

4. **Registrar o novo tipo**  
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

<!--
### Configuração do lado do cliente e interface de gerenciamento
No lado do cliente, você precisa informar ao gerenciador de arquivos como renderizar o formulário de configuração e se há lógica de upload personalizada. Cada objeto de tipo de armazenamento contém as seguintes propriedades:
-->

## Estendendo tipos de arquivos no frontend

Para arquivos já enviados, você pode exibir diferentes conteúdos de pré-visualização na interface do frontend com base no tipo de arquivo. O campo de anexos do gerenciador de arquivos possui uma pré-visualização baseada no navegador (embutida em um iframe), que suporta a visualização da maioria dos formatos (como imagens, vídeos, áudio e PDFs) diretamente no navegador. Quando um formato de arquivo não é suportado pelo navegador ou quando interações especiais de pré-visualização são necessárias, você pode estender o componente de pré-visualização baseado no tipo de arquivo.

### Exemplo

Por exemplo, se você deseja integrar uma pré-visualização online personalizada para arquivos Office, pode usar o seguinte código:

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

Aqui, `filePreviewTypes` é o objeto de entrada fornecido por `@nocobase/plugin-file-manager/client` para estender pré-visualizações de arquivos. Use seu método `add` para adicionar um objeto descritor de tipo de arquivo.

Cada tipo de arquivo deve implementar um método `match()` para verificar se o tipo atende aos requisitos. No exemplo, `matchMimetype` é usado para verificar o atributo `mimetype` do arquivo. Se corresponder ao tipo `docx`, ele é considerado o tipo a ser tratado. Se não corresponder, será usada a lógica integrada.

A propriedade `Previewer` no objeto descritor de tipo é o componente usado para pré-visualização. Quando o tipo de arquivo corresponde, esse componente é renderizado na caixa de diálogo de pré-visualização. Você pode retornar qualquer visualização React (como iframe, player ou gráfico).

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

`filePreviewTypes` é uma instância global importada de `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Registra um novo objeto descritor de tipo de arquivo no registro de tipos. O tipo do descritor é `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Método de correspondência de formato de arquivo.

O parâmetro de entrada `file` é o objeto de dados de um arquivo enviado, contendo propriedades relevantes para verificação de tipo:

* `mimetype`: descrição do mimetype
* `extname`: extensão do arquivo, incluindo "."
* `path`: caminho de armazenamento relativo do arquivo
* `url`: URL do arquivo

Retorna um `boolean` indicando se houve correspondência.

##### `getThumbnailURL`

Retorna a URL da miniatura usada na lista de arquivos. Se o valor retornado for vazio, a imagem de placeholder integrada será usada.

##### `Previewer`

Um componente React para pré-visualizar arquivos.

As props de entrada são:

* `file`: objeto do arquivo atual (pode ser uma URL em string ou um objeto contendo `url`/`preview`)
* `index`: índice do arquivo na lista
* `list`: lista de arquivos

