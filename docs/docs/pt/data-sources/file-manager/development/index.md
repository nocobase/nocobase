---
title: "Desenvolvimento de extensões do gerenciador de arquivos"
description: "Extensão de componentes de visualização de tipos de arquivo, campos de anexos personalizados e lógica de upload, com base nas APIs attachmentFileTypes, mime-match e outras."
keywords: "extensão do gerenciador de arquivos, extensão de campo de anexo, extensão de visualização de arquivos,attachmentFileTypes,NocoBase"
---

# Desenvolvimento de extensões

## Tipos de arquivo no frontend da extensão

Para arquivos que já foram enviados, é possível exibir diferentes conteúdos de visualização na interface do frontend com base nos diferentes tipos de arquivo. O campo de anexos do gerenciador de arquivos já inclui a visualização baseada no navegador (incorporada em um iframe), que oferece suporte à visualização direta no navegador da maioria dos formatos de arquivo (imagens, vídeos, áudios e PDFs, entre outros). Quando o formato do arquivo não é compatível com a visualização do navegador ou quando são necessárias interações especiais de visualização, é possível implementar isso estendendo componentes de visualização com base no tipo de arquivo.

### Exemplo

Por exemplo, para adicionar um componente de carrossel a arquivos do tipo imagem, isso pode ser feito usando o código a seguir:

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

Nesse código, `attachmentFileTypes` é o objeto de entrada para a extensão de tipos de arquivo fornecido pelo pacote `@nocobase/client`. O método `add` fornecido por ele é usado para estender um objeto de descrição de tipo de arquivo.

Cada tipo de arquivo deve implementar um método `match()`, usado para verificar se o tipo de arquivo atende aos requisitos. No exemplo, o método fornecido pelo pacote `mime-match` é usado para verificar a propriedade `mimetype` do arquivo. Se ela corresponder ao tipo `image/*`, o arquivo será considerado um tipo que precisa ser processado. Se não houver correspondência, será usado o tratamento de tipo integrado como alternativa.

A propriedade `Previewer` no objeto de descrição do tipo é o componente usado para a visualização. Quando o tipo de arquivo corresponder, esse componente será renderizado para realizar a visualização. Em geral, recomenda-se usar um componente do tipo janela modal como contêiner básico (como `<Modal />`, entre outros) e inserir nele o conteúdo de visualização e as interações necessárias para implementar a funcionalidade.

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

`attachmentFileTypes` é uma instância global, importada por meio de `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registra um novo objeto de descrição de tipo de arquivo no registro de tipos de arquivo. O tipo do objeto de descrição é `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Método de correspondência de formatos de arquivo.

O parâmetro `file` recebe o objeto de dados do arquivo enviado, que contém propriedades relevantes para determinar o tipo:

* `mimetype`: descrição do mimetype
* `extname`: extensão do arquivo, incluindo “.”
* `path`: caminho relativo de armazenamento do arquivo
* `url`: URL do arquivo

O valor de retorno é do tipo `boolean` e indica se houve correspondência.

##### `Previewer`

Componente React usado para visualizar o arquivo.

Os parâmetros de Props são:

* `index`: índice do arquivo na lista de anexos
* `list`: lista de anexos
* `onSwitchIndex`: método usado para alterar o índice

Em `onSwitchIndex`, pode ser informado qualquer índice da lista para alternar para outro arquivo. Se `null` for usado como parâmetro de alternância, o componente de visualização será fechado diretamente.

```ts
onSwitchIndex(null);
```
