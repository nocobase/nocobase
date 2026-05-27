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

* Plugin de pré-visualização de arquivos do Office

## Pré-visualização de PDF com armazenamento externo

A pré-visualização de PDF usa PDF.js para renderizar arquivos no navegador. O navegador precisa primeiro ler o conteúdo do arquivo PDF e depois passá-lo para o PDF.js para renderização. Portanto, quando os arquivos estão armazenados em armazenamento externo, como OSS, S3, COS ou CDN, e o domínio de acesso ao arquivo é diferente do domínio do site NocoBase, o armazenamento externo precisa permitir que o site NocoBase leia arquivos entre origens.

Se o CORS não estiver configurado, o download de PDFs ainda poderá funcionar normalmente, mas a pré-visualização poderá falhar com um erro de carregamento do arquivo.

A configuração CORS do armazenamento externo ou CDN deve incluir:

```http
Access-Control-Allow-Origin: https://your-nocobase-domain
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Allow-Headers: *
Access-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges, Content-Disposition, Content-Type
```

`Access-Control-Allow-Origin` deve ser configurado com o domínio real usado para acessar o NocoBase. Evite usar `*` a longo prazo para arquivos não públicos, pois isso amplia o conjunto de sites que podem ler os arquivos.
