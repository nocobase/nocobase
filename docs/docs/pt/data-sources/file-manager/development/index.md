:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Desenvolvimento de Extensões

## Estendendo Tipos de Arquivo no Frontend

Para arquivos já carregados, a interface do usuário (UI) no frontend pode exibir diferentes pré-visualizações com base nos tipos de arquivo. O campo de anexo do gerenciador de arquivos possui uma pré-visualização de arquivo integrada baseada no navegador (embutida em um iframe), que suporta a maioria dos formatos de arquivo (como imagens, vídeos, áudios e PDFs) para visualização direta. Quando um tipo de arquivo não é suportado para pré-visualização no navegador, ou quando há necessidade de uma interação de pré-visualização especial, você pode estender os componentes de pré-visualização com base no tipo de arquivo.

### Exemplo

Por exemplo, se você quiser estender um componente de carrossel para arquivos de imagem, pode usar o seguinte código:

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

O `attachmentFileTypes` é um objeto de entrada fornecido pelo pacote `@nocobase/client` para estender tipos de arquivo. Você pode usar o método `add` dele para estender um descritor de tipo de arquivo.

Cada tipo de arquivo deve implementar um método `match()` para verificar se o tipo de arquivo atende aos requisitos. No exemplo, o pacote `mime-match` é usado para verificar o atributo `mimetype` do arquivo. Se ele corresponder a `image/*`, é considerado um tipo de arquivo que precisa ser processado. Se não houver correspondência, ele retornará ao tratamento de tipo integrado.

A propriedade `Previewer` no descritor de tipo é o componente usado para pré-visualização. Quando o tipo de arquivo corresponde, este componente será renderizado para a pré-visualização. Geralmente, é recomendado usar um componente modal (como `<Modal />`) como contêiner base e colocar o conteúdo de pré-visualização e interação dentro desse componente para implementar a funcionalidade de pré-visualização.

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

`attachmentFileTypes` é uma instância global, importada do pacote `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registra um novo descritor de tipo de arquivo no registro de tipos de arquivo. O tipo do descritor é `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Um método para corresponder formatos de arquivo.

O parâmetro `file` é um objeto de dados para o arquivo carregado, contendo propriedades que podem ser usadas para verificação de tipo:

*   `mimetype`: O mimetype do arquivo.
*   `extname`: A extensão do arquivo, incluindo o `.`.
*   `path`: O caminho de armazenamento relativo do arquivo.
*   `url`: A URL do arquivo.

Retorna um valor booleano indicando se o arquivo corresponde.

##### `Previewer`

Um componente React para pré-visualizar o arquivo.

Parâmetros de Props:

*   `index`: O índice do arquivo na lista de anexos.
*   `list`: A lista de anexos.
*   `onSwitchIndex`: Uma função para alternar o arquivo pré-visualizado pelo seu índice.

A função `onSwitchIndex` pode ser chamada com qualquer índice da `list` para alternar para outro arquivo. Chamá-la com `null` fecha o componente de pré-visualização.

```ts
onSwitchIndex(null);
```