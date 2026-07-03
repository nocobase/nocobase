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

* [Plugin de pré-visualização de arquivos do Office](../file-preview/ms-office.md)

## Pré-visualização de PDF com armazenamento externo

A NocoBase pré-visualiza PDFs por meio de um iframe do navegador. Alguns navegadores ou leitores de PDF podem oferecer suporte a scripts, formulários ou outros conteúdos interativos dentro de arquivos PDF. Se o arquivo pré-visualizado vier de uma origem não confiável, preste atenção ao limite de segurança da execução de scripts.

Recomendamos isolar o domínio de acesso aos arquivos dos domínios do site NocoBase e da API. Por exemplo, sirva arquivos de OSS, S3, COS ou CDN por um domínio dedicado, em vez de compartilhar a mesma origem com o frontend ou a API da NocoBase.

Se o domínio dos arquivos for diferente do domínio da API, e a API não habilitar CORS para o domínio dos arquivos, os scripts executados no ambiente de pré-visualização de PDF normalmente ficam restritos pela política de mesma origem do navegador. Eles não conseguem ler diretamente a página da NocoBase, o armazenamento do navegador ou as respostas da API.
