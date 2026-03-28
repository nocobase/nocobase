---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/file-manager/file-preview/ms-office).
:::

# Visualização de Arquivos Office <Badge>v1.8.11+</Badge>

O plugin de Visualização de Arquivos Office é usado para visualizar arquivos no formato Office em aplicações NocoBase, como Word, Excel e PowerPoint.  
Ele é baseado em um serviço online público fornecido pela Microsoft, que permite que arquivos acessíveis via uma URL pública sejam incorporados em uma interface de visualização, permitindo que você visualize esses arquivos em um navegador sem a necessidade de baixá-los ou usar aplicativos Office.

## Manual do Usuário

Por padrão, o plugin está no estado **desativado**. Ele pode ser usado após ser ativado no gerenciador de plugins, sem a necessidade de configuração adicional.

![Interface de ativação do plugin](https://static-docs.nocobase.com/20250731140048.png)

Após fazer o upload de um arquivo Office (Word / Excel / PowerPoint) com sucesso em um campo de arquivo de uma coleção, clique no ícone ou link do arquivo correspondente para visualizar o conteúdo do arquivo na interface de visualização pop-up ou incorporada.

![Exemplo de operação de visualização](https://static-docs.nocobase.com/20250731143231.png)

## Princípio de Implementação

A visualização incorporada por este plugin depende do serviço online público da Microsoft (Office Web Viewer). O processo principal é o seguinte:

- O frontend gera uma URL acessível publicamente para o arquivo enviado pelo usuário (incluindo URLs assinadas do S3);
- O plugin carrega a visualização do arquivo em um iframe usando o seguinte endereço:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<URL Pública do Arquivo>
  ```

- O serviço da Microsoft solicita o conteúdo do arquivo a partir desta URL, realiza a renderização e retorna uma página visualizável.

## Observações

- Como este plugin depende do serviço online da Microsoft, certifique-se de que a conexão de rede esteja normal e que os serviços relacionados da Microsoft possam ser acessados.
- A Microsoft acessará a URL do arquivo que você fornecer, e o conteúdo do arquivo será armazenado temporariamente em cache pelo servidor deles para renderizar a página de visualização. Portanto, existe um certo risco de privacidade. Se você tiver preocupações sobre isso, recomendamos não usar a função de visualização fornecida por este plugin[^1].
- O arquivo a ser visualizado deve ter uma URL acessível publicamente. Em circunstâncias normais, os arquivos enviados para o NocoBase gerarão automaticamente links públicos acessíveis (incluindo URLs assinadas geradas pelo plugin S3-Pro), mas se o arquivo tiver permissões de acesso definidas ou estiver armazenado em um ambiente de rede interna, ele não poderá ser visualizado[^2].
- O serviço não suporta autenticação de login ou recursos em armazenamento privado. Por exemplo, arquivos que só são acessíveis dentro de uma rede interna ou que exigem login não podem usar esta função de visualização.
- Após o conteúdo do arquivo ser capturado pelo serviço da Microsoft, ele pode ser armazenado em cache por um curto período. Mesmo que o arquivo de origem seja excluído, o conteúdo da visualização ainda poderá estar acessível por algum tempo.
- Existem limites recomendados para o tamanho dos arquivos: recomenda-se que arquivos Word e PowerPoint não excedam 10MB, e arquivos Excel não excedam 5MB para garantir a estabilidade da visualização[^3].
- Atualmente, não há uma descrição oficial clara de licença de uso comercial para este serviço. Avalie os riscos por conta própria ao utilizá-lo[^4].

## Formatos de Arquivo Suportados

O plugin suporta apenas visualizações para os seguintes formatos de arquivo Office, com base no tipo MIME ou na extensão do arquivo:

- Documentos Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) ou `application/msword` (`.doc`)
- Planilhas Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) ou `application/vnd.ms-excel` (`.xls`)
- Apresentações PowerPoint:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) ou `application/vnd.ms-powerpoint` (`.ppt`)
- Texto OpenDocument: `application/vnd.oasis.opendocument.text` (`.odt`)

Arquivos em outros formatos não ativarão a função de visualização deste plugin.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)