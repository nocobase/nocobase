---
pkg: '@nocobase/plugin-file-manager'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Pré-visualização de arquivos

Em interfaces que contêm campos de arquivo, incluindo campos de anexo, você pode pré-visualizar arquivos clicando na miniatura ou no ícone do arquivo. A função de pré-visualização integrada oferece suporte a vários tipos de arquivo, incluindo imagens, PDFs e a maioria dos tipos de arquivo suportados nativamente pelos navegadores.

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

Para tipos de arquivo que não têm pré-visualização nativa, você pode habilitar a funcionalidade instalando ou estendendo os plugins de pré-visualização de arquivos correspondentes. Por exemplo, após instalar o plugin de pré-visualização de arquivos do Office, você poderá pré-visualizar arquivos do Word, Excel e PowerPoint.

Atualmente, o NocoBase fornece os seguintes plugins de pré-visualização de arquivos:

- [Plugin de pré-visualização de arquivos do Office](./ms-office.md)

## Mecanismo de pré-visualização de PDF

O NocoBase escolhe o método de pré-visualização de acordo com a origem da URL do arquivo PDF:

| URL do arquivo | Armazenamento comum | Método de pré-visualização | Requisito de CORS |
| --- | --- | --- | --- |
| Mesma origem do NocoBase | Armazenamento local | O NocoBase lê o arquivo e o renderiza com o PDF.js integrado | Não há CORS entre origens |
| Origem diferente | Armazenamento externo como OSS, S3, COS ou CDN | O navegador abre a URL em um iframe | A pré-visualização no iframe não exige CORS |

:::tip Critério de seleção

O método depende da origem da URL, não diretamente do nome do mecanismo de armazenamento. O armazenamento local servido por um domínio de arquivos separado é tratado como origem diferente. O armazenamento externo acessado por um proxy do NocoBase com a mesma origem é tratado como mesma origem.

:::

### Armazenamento local ou URL da mesma origem

As URLs do armazenamento local normalmente começam com `/storage/uploads/` e têm a mesma origem da página do NocoBase. Durante a pré-visualização, o NocoBase lê os dados do PDF e usa o PDF.js integrado para renderizar as páginas e o texto.

Esse método não depende do leitor de PDF integrado ao navegador. Mesmo que a resposta use `Content-Disposition: attachment` por segurança, o NocoBase pode ler e renderizar o arquivo no componente de pré-visualização. A URL precisa estar acessível com a sessão atual.

### Armazenamento externo ou URL de outra origem

Serviços OSS, S3, COS e CDN normalmente usam um domínio separado. O NocoBase coloca a URL do PDF em um iframe, portanto o resultado depende do navegador e dos cabeçalhos de resposta do serviço de armazenamento.

Para abrir o PDF no iframe, o serviço normalmente deve retornar `Content-Type: application/pdf` e não deve forçar o download com `Content-Disposition: attachment`. Se a resposta exigir o download, o navegador baixa o arquivo diretamente e o NocoBase não pode substituir esse comportamento no frontend.

Carregar um PDF de outra origem em um iframe não exige CORS. No entanto, o botão de download lê o arquivo com `fetch` e cria um Blob. Por isso, downloads entre origens exigem que o serviço permita solicitações CORS do site NocoBase.

### Observações sobre o Aliyun OSS

Em alguns casos, o domínio padrão do Aliyun OSS força o download ao retornar `Content-Disposition: attachment` e `x-oss-force-download: true`. As imagens podem continuar sendo pré-visualizadas, enquanto um PDF aberto no iframe é baixado.

Normalmente, isso pode ser resolvido vinculando um domínio personalizado ao bucket e configurando o NocoBase para acessar os arquivos por esse domínio. Consulte [Problemas comuns do Aliyun OSS](../storage/aliyun-oss.md#problemas-comuns) para ver as etapas de configuração e diagnóstico.

### Limite de segurança da pré-visualização entre origens

Alguns navegadores ou leitores de PDF podem oferecer suporte a scripts, formulários ou outros conteúdos interativos dentro de arquivos PDF. Se o arquivo pré-visualizado vier de uma origem não confiável, preste atenção ao limite de segurança da execução de scripts.

Recomendamos isolar o domínio de acesso aos arquivos dos domínios do site NocoBase e da API. Por exemplo, sirva arquivos de OSS, S3, COS ou CDN por um domínio dedicado, em vez de compartilhar a mesma origem com o frontend ou a API da NocoBase.

Se o domínio dos arquivos for diferente do domínio da API, e a API não habilitar CORS para o domínio dos arquivos, os scripts executados no ambiente de pré-visualização de PDF normalmente ficam restritos pela política de mesma origem do navegador. Eles não conseguem ler diretamente a página da NocoBase, o armazenamento do navegador ou as respostas da API.

## Links relacionados

- [Plugin de pré-visualização de arquivos do Office](./ms-office.md)
- [Aliyun OSS](../storage/aliyun-oss.md)
- [S3 Pro](../storage/s3-pro.md)
