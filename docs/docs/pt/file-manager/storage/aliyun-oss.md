# Motor de Armazenamento: Aliyun OSS

Um motor de armazenamento baseado no Aliyun OSS. Antes de usá-lo, você precisará preparar a conta e as permissões necessárias.


:::warning Observação

Este mecanismo não oferece acesso privado. Depois que um arquivo é enviado, o NocoBase gera uma URL diretamente acessível, e qualquer pessoa com essa URL pode acessar o arquivo.

Mesmo que o bucket OSS seja privado, o mecanismo integrado Aliyun OSS não gera URLs assinadas temporárias para acesso a arquivos. Se precisar de acesso privado, use [S3 Pro](./s3-pro.md). Se já houver arquivos históricos, consulte [Migrar para S3 Pro](./migrate-to-s3-pro.md).

:::

## Parâmetros de Configuração

![Exemplo de Configuração do Motor de Armazenamento Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Dica}
Esta seção apresenta apenas os parâmetros específicos do motor de armazenamento Aliyun OSS. Para os parâmetros gerais, consulte [Parâmetros Gerais do Motor](./index.md#parâmetros-comuns).
:::

### URL base

Informe o prefixo da URL de acesso aos arquivos, como um domínio personalizado vinculado ao bucket atual: `https://oss.example.com`. O domínio padrão do Aliyun OSS pode fazer o navegador baixar arquivos PDF. Recomendamos vincular primeiro um domínio personalizado. Consulte [Problemas comuns](#problemas-comuns) abaixo.

### Região

Insira a região de armazenamento do OSS, por exemplo: `oss-cn-hangzhou`.

:::info{title=Dica}
Você pode visualizar as informações de região do seu bucket no [Console Aliyun OSS](https://oss.console.aliyun.com/). Você só precisa usar o prefixo da região (não o nome de domínio completo).
:::

### AccessKey ID

Insira o ID da sua chave de acesso do Aliyun.

### AccessKey Secret

Insira o Secret da sua chave de acesso do Aliyun.

### Bucket

Insira o nome do bucket do OSS.

### Tempo Limite

Insira o tempo limite para upload no Aliyun OSS, em milissegundos. O valor padrão é `60000` milissegundos (ou seja, 60 segundos).

## Problemas comuns

### O PDF é baixado em vez de ser pré-visualizado

O NocoBase pré-visualiza PDFs de outra origem em um iframe. O navegador acessa diretamente a URL do OSS, portanto os cabeçalhos de resposta determinam se o arquivo será exibido ou baixado.

Se o PDF for baixado pelo iframe, verifique a solicitação no painel «Rede» das ferramentas de desenvolvimento. Uma resposta problemática típica é:

```http
Content-Type: application/pdf
Content-Disposition: attachment
x-oss-force-download: true
```

`Content-Type: application/pdf` identifica o arquivo corretamente, mas `Content-Disposition: attachment` instrui o navegador a baixá-lo. O domínio padrão do Aliyun OSS força downloads em alguns casos. Consulte a documentação oficial: [Configurar um PDF para ser pré-visualizado em vez de baixado](https://help.aliyun.com/zh/oss/user-guide/how-do-i-configure-an-object-to-be-previewed-instead-of-downloaded).

Recomendamos esta configuração:

1. Siga [Acessar recursos do OSS por um domínio personalizado](https://help.aliyun.com/zh/oss/user-guide/access-buckets-via-custom-domain-names) para vincular um domínio ao bucket
2. Configure o DNS e o certificado HTTPS e confirme que o domínio acessa o arquivo diretamente
3. Configure a URL de acesso no mecanismo de armazenamento usado pelo NocoBase

Para a etapa 3:

- No mecanismo integrado **Aliyun OSS**, defina **URL base** como o domínio vinculado, por exemplo `https://oss.example.com`
- No [S3 Pro](./s3-pro.md) conectado ao Aliyun OSS, o endpoint de upload pode continuar usando o endpoint regional do OSS; defina o endpoint de acesso como o domínio personalizado e `Full access URL style` como `Ignore`

Envie um novo PDF para verificar a configuração. Se um registro existente armazenar uma URL completa, confirme também que a URL retornada ao frontend passou a usar o domínio personalizado.

:::tip Verifique os cabeçalhos

A pré-visualização de um PDF de outra origem em um iframe não exige CORS. A exibição integrada depende principalmente de `Content-Type` e `Content-Disposition`. Isso é diferente do requisito CORS do botão de download descrito abaixo.

:::

### A imagem aparece, mas o botão de download informa um erro CORS

As imagens normalmente são exibidas com `<img>` e os PDFs de outra origem com um iframe. Ambos podem exibir recursos sem cabeçalhos CORS. No entanto, o botão de download lê o arquivo com `fetch` e cria um Blob. Essa solicitação está sujeita à política de mesma origem do navegador.

O erro a seguir indica que o OSS não retornou `Access-Control-Allow-Origin` para o site NocoBase atual:

```text
Access to fetch at 'https://oss.example.com/path/to/file.jpg' from origin
'https://example.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Siga o guia oficial [Configurar CORS](https://help.aliyun.com/zh/oss/user-guide/configure-cross-origin-resource-sharing) e crie uma regra para o bucket. Para downloads pelo componente de pré-visualização, use valores como estes:

| Configuração | Valor recomendado |
| --- | --- |
| Allowed Origins | O origin completo do NocoBase, como `https://example.com` |
| Allowed Methods | `GET`, `HEAD` |
| Allowed Headers | `*` |
| Expose Headers | `ETag`, `Content-Disposition` |
| MaxAgeSeconds | `600` |

Se o S3 Pro também enviar arquivos diretamente pelo navegador, adicione métodos como `PUT` e `POST` de acordo com as solicitações reais mostradas no painel «Rede», ou crie uma regra de upload separada.

Depois de salvar a regra, solicite o arquivo novamente com o origin do site NocoBase. A resposta deve incluir pelo menos:

```http
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, HEAD
```

O navegador pode já ter armazenado em cache a resposta usada para exibir a imagem. Essa solicitação não incluía o cabeçalho `Origin`, e a resposta em cache pode não conter `Access-Control-Allow-Origin`. Se o download continuar falhando depois da configuração de CORS, limpe o cache do arquivo ou ative «Desabilitar cache» nas ferramentas de desenvolvimento e tente novamente.

### Verificar os cabeçalhos de resposta

Use `curl` para simular uma solicitação entre origens a partir do site NocoBase. Substitua o origin, a URL e os parâmetros de assinatura do exemplo pelos valores reais:

```bash
curl -sS -D - -o /dev/null \
  -H 'Origin: https://example.com' \
  'https://oss.example.com/path/to/file.pdf?<signed-query>'
```

Verifique os seguintes resultados:

- A pré-visualização retorna `Content-Type: application/pdf` sem `Content-Disposition: attachment`
- O download entre origens retorna `Access-Control-Allow-Origin` correspondente ao site NocoBase
- A URL real usa o domínio personalizado em vez do domínio padrão `*.oss-cn-*.aliyuncs.com`

É normal que uma solicitação sem `Origin` não receba cabeçalhos CORS. Mantenha o cabeçalho `Origin` do exemplo ao verificar a configuração.

## Links relacionados

- [Pré-visualização de arquivos](../file-preview/index.md)
- [S3 Pro](./s3-pro.md)
- [Migrar para S3 Pro](./migrate-to-s3-pro.md)
- [Mecanismos de armazenamento](./index.md)
