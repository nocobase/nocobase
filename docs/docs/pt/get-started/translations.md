:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/get-started/translations).
:::

# Contribuição de tradução

O idioma padrão do NocoBase é o inglês. Atualmente, o aplicativo principal suporta inglês, italiano, holandês, chinês simplificado e japonês. Convidamos você sinceramente a contribuir com traduções para outros idiomas, permitindo que usuários de todo o mundo desfrutem de uma experiência NocoBase ainda mais conveniente.

---

## I. Localização do Sistema

### 1. Tradução da Interface do Sistema e Plugins

#### 1.1 Escopo da Tradução
Aplica-se apenas à localização da interface do sistema NocoBase e de seus plugins, não abrangendo outros conteúdos personalizados (como tabelas de dados ou blocos de Markdown).

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Visão Geral do Conteúdo de Localização
O NocoBase utiliza o Git para gerenciar seu conteúdo de localização. O repositório principal é:
https://github.com/nocobase/nocobase/tree/main/locales

Cada idioma é representado por um arquivo JSON nomeado de acordo com seu código de idioma (ex: de-DE.json, fr-FR.json). A estrutura do arquivo é organizada por módulos de plugin, utilizando pares chave-valor para armazenar as traduções. Por exemplo:

```json
{
  // Plugin de cliente
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...outros pares chave-valor
  },
  "@nocobase/plugin-acl": {
    // Pares chave-valor para este plugin
  }
  // ...outros módulos de plugin
}
```

Ao traduzir, por favor, converta-o gradualmente para uma estrutura semelhante à seguinte:

```json
{
  // Plugin de cliente
  "@nocobase/client": {
    "(Fields only)": "(Apenas campos - traduzido)",
    "12 hour": "12 horas",
    "24 hour": "24 horas"
    // ...outros pares chave-valor
  },
  "@nocobase/plugin-acl": {
    // Pares chave-valor para este plugin
  }
  // ...outros módulos de plugin
}
```

#### 1.3 Teste e Sincronização da Tradução
- Após concluir sua tradução, teste e verifique se todos os textos são exibidos corretamente.
Também lançamos um plugin de validação de tradução - procure por `Locale tester` no mercado de plugins.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Após a instalação, copie o conteúdo JSON do arquivo de localização correspondente no repositório git, cole-o dentro do plugin e clique em OK para verificar se o conteúdo da tradução está funcionando.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- Uma vez enviado, os scripts do sistema sincronizarão automaticamente o conteúdo de localização para o repositório de código.

#### 1.4 Plugin de Localização do NocoBase 2.0

> **Nota:** Esta seção está em desenvolvimento. O plugin de localização para o NocoBase 2.0 possui algumas diferenças em relação à versão 1.x. Detalhes serão fornecidos em uma atualização futura.

<!-- TODO: Adicionar detalhes sobre as diferenças do plugin de localização 2.0 -->

## II. Localização da Documentação (NocoBase 2.0)

A documentação do NocoBase 2.0 é gerenciada em uma nova estrutura. Os arquivos fonte da documentação estão localizados no repositório principal do NocoBase:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Estrutura da Documentação

A documentação utiliza o [Rspress](https://rspress.dev/) como gerador de site estático e suporta 8 idiomas. A estrutura é organizada da seguinte forma:

```
docs/
├── docs/
│   ├── en/                    # Inglês (idioma de origem)
│   ├── cn/                    # Chinês Simplificado
│   ├── ja/                    # Japonês
│   ├── de/                    # Alemão
│   ├── fr/                    # Francês
│   ├── es/                    # Espanhol
│   ├── pt/                    # Português
│   ├── ru/                    # Russo
│   └── public/                # Ativos compartilhados (imagens, etc.)
├── theme/                     # Tema personalizado
├── rspress.config.ts          # Configuração do Rspress
└── package.json
```

### 2.2 Fluxo de Trabalho de Tradução

1. **Sincronização com a origem em inglês**: Todas as traduções devem ser baseadas na documentação em inglês (`docs/en/`). Quando a documentação em inglês for atualizada, as traduções devem ser atualizadas adequadamente.

2. **Estratégia de ramificação (branch)**:
   - Use a branch `develop` ou `next` como referência para o conteúdo mais recente em inglês.
   - Crie sua branch de tradução a partir da branch de destino.

3. **Estrutura de arquivos**: Cada diretório de idioma deve espelhar a estrutura do diretório em inglês. Por exemplo:
   ```
   docs/en/get-started/index.md    →    docs/pt/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/pt/api/acl/acl.md
   ```

### 2.3 Contribuindo com Traduções

1. Faça um Fork do repositório: https://github.com/nocobase/nocobase
2. Clone seu fork e mude para a branch `develop` ou `next`.
3. Navegue até o diretório `docs/docs/`.
4. Encontre o diretório do idioma com o qual deseja contribuir (ex: `pt/` para português).
5. Traduza os arquivos markdown, mantendo a mesma estrutura de arquivos da versão em inglês.
6. Teste suas alterações localmente:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Envie um Pull Request para o repositório principal.

### 2.4 Diretrizes de Tradução

- **Mantenha a formatação consistente**: Mantenha a mesma estrutura de markdown, cabeçalhos, blocos de código e links da origem.
- **Preserve o frontmatter**: Mantenha qualquer YAML frontmatter no topo dos arquivos inalterado, a menos que contenha conteúdo traduzível.
- **Referências de imagem**: Use os mesmos caminhos de imagem de `docs/public/` - as imagens são compartilhadas entre todos os idiomas.
- **Links internos**: Atualize os links internos para apontar para o caminho correto do idioma.
- **Exemplos de código**: Geralmente, os exemplos de código não devem ser traduzidos, mas os comentários dentro do código podem ser traduzidos.

### 2.5 Configuração de Navegação

A estrutura de navegação para cada idioma é definida nos arquivos `_nav.json` e `_meta.json` dentro de cada diretório de idioma. Ao adicionar novas páginas ou seções, certifique-se de atualizar esses arquivos de configuração.

## III. Localização do Site

As páginas do site e todo o conteúdo estão armazenados em:
https://github.com/nocobase/website

### 3.1 Primeiros Passos e Recursos de Referência

Ao adicionar um novo idioma, consulte as páginas de idiomas existentes:
- Inglês: https://github.com/nocobase/website/tree/main/src/pages/en
- Chinês: https://github.com/nocobase/website/tree/main/src/pages/cn
- Japonês: https://github.com/nocobase/website/tree/main/src/pages/ja

![Diagrama de Localização do Site](https://static-docs.nocobase.com/20250319121600.png)

As modificações de estilo global estão localizadas em:
- Inglês: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Chinês: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Japonês: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Diagrama de Estilo Global](https://static-docs.nocobase.com/20250319121501.png)

A localização dos componentes globais do site está disponível em:
https://github.com/nocobase/website/tree/main/src/components

![Diagrama de Componentes do Site](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 Estrutura de Conteúdo e Método de Localização

Utilizamos uma abordagem mista de gerenciamento de conteúdo. O conteúdo e os recursos em inglês, chinês e japonês são sincronizados regularmente a partir do sistema CMS e substituídos, enquanto outros idiomas podem ser editados diretamente em arquivos locais. O conteúdo local é armazenado no diretório `content`, organizado da seguinte forma:

```
/content
  /articles        # Artigos do blog
    /article-slug
      index.md     # Conteúdo em inglês (padrão)
      index.cn.md  # Conteúdo em chinês
      index.ja.md  # Conteúdo em japonês
      metadata.json # Metadados e outras propriedades de localização
  /tutorials       # Tutoriais
  /releases        # Informações de lançamento
  /pages           # Algumas páginas estáticas
  /categories      # Informações de categoria
    /article-categories.json  # Lista de categorias de artigos
    /category-slug            # Detalhes de categoria individual
      /category.json
  /tags            # Informações de tags
    /article-tags.json        # Lista de tags de artigos
    /release-tags.json        # Lista de tags de lançamento
    /tag-slug                 # Detalhes de tag individual
      /tag.json
  /help-center     # Conteúdo da central de ajuda
    /help-center-tree.json    # Estrutura de navegação da central de ajuda
  ....
```

### 3.3 Diretrizes de Tradução de Conteúdo

- Sobre a Tradução de Conteúdo Markdown

1. Crie um novo arquivo de idioma baseado no arquivo padrão (ex: de `index.md` para `index.pt.md`).
2. Adicione propriedades localizadas nos campos correspondentes no arquivo JSON.
3. Mantenha a consistência na estrutura do arquivo, links e referências de imagem.

- Tradução de Conteúdo JSON
Muitos metadados de conteúdo são armazenados em arquivos JSON, que normalmente contêm campos multilíngues:

```json
{
  "id": 123,
  "title": "English Title",       // Título em inglês (padrão)
  "title_cn": "中文标题",          // Título em chinês
  "title_ja": "日本語タイトル",    // Título em japonês
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // Caminho da URL (geralmente não traduzido)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**Notas de Tradução:**

1. **Convenção de Nomenclatura de Campos**: Os campos de tradução geralmente usam o formato `{campo_original}_{codigo_do_idioma}`.
   - Por exemplo: title_pt (título em português), description_pt (descrição em português).

2. **Ao Adicionar um Novo Idioma**:
   - Adicione uma versão com sufixo de idioma correspondente para cada campo que precise de tradução.
   - Não modifique os valores dos campos originais (como title, description, etc.), pois eles servem como conteúdo do idioma padrão (inglês).

3. **Mecanismo de Sincronização do CMS**:
   - O sistema CMS atualiza periodicamente o conteúdo em inglês, chinês e japonês.
   - O sistema apenas atualizará/substituirá o conteúdo para esses três idiomas (algumas propriedades no JSON) e **não excluirá** os campos de idioma adicionados por outros contribuidores.
   - Por exemplo: se você adicionou uma tradução em português (title_pt), a sincronização do CMS não afetará este campo.


### 3.4 Configurando o Suporte para um Novo Idioma

Para adicionar suporte a um novo idioma, você precisa modificar a configuração `SUPPORTED_LANGUAGES` no arquivo `src/utils/index.ts`:

```typescript
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    default: true
  },
  cn: {
    code: 'cn',
    locale: 'zh-CN',
    name: 'Chinese'
  },
  ja: {
    code: 'ja',
    locale: 'ja-JP',
    name: 'Japanese'
  },
  // Exemplo de adição de um novo idioma:
  pt: {
    code: 'pt',
    locale: 'pt-BR',
    name: 'Portuguese'
  }
};
```

### 3.5 Arquivos de Layout e Estilos

Cada idioma precisa de arquivos de layout correspondentes:

1. Crie um novo arquivo de layout (ex: para português, crie `src/layouts/BasePT.astro`).
2. Você pode copiar um arquivo de layout existente (como `BaseEN.astro`) e traduzi-lo.
3. O arquivo de layout contém traduções para elementos globais como menus de navegação, rodapés, etc.
4. Certifique-se de atualizar a configuração do seletor de idiomas para alternar corretamente para o idioma recém-adicionado.

### 3.6 Criando Diretórios de Páginas de Idioma

Crie diretórios de páginas independentes para o novo idioma:

1. Crie uma pasta nomeada com o código do idioma no diretório `src` (ex: `src/pt/`).
2. Copie a estrutura de páginas de outros diretórios de idiomas (ex: `src/en/`).
3. Atualize o conteúdo das páginas, traduzindo títulos, descrições e textos para o idioma de destino.
4. Garanta que as páginas usem o componente de layout correto (ex: `.layout: '@/layouts/BasePT.astro'`).

### 3.7 Localização de Componentes

Alguns componentes comuns também precisam de tradução:

1. Verifique os componentes no diretório `src/components/`.
2. Preste atenção especial aos componentes com texto fixo (como barras de navegação, rodapés, etc.).
3. Os componentes podem usar renderização condicional para exibir conteúdo em diferentes idiomas:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/pt') && <p>Conteúdo em português</p>}
```

### 3.8 Teste e Validação

Após concluir a tradução, realize testes completos:

1. Execute o site localmente (geralmente usando `yarn dev`).
2. Verifique como todas as páginas são exibidas no novo idioma.
3. Valide se a funcionalidade de troca de idioma funciona corretamente.
4. Certifique-se de que todos os links apontam para as versões de página do idioma correto.
5. Verifique os layouts responsivos para garantir que o texto traduzido não quebre o design da página.

## IV. Como Começar a Traduzir

Se você deseja contribuir com uma nova tradução de idioma para o NocoBase, siga estes passos:

| Componente | Repositório | Branch | Notas |
|------------|------------|--------|-------|
| Interface do Sistema | https://github.com/nocobase/nocobase/tree/main/locales | main | Arquivos JSON de localização |
| Documentação (2.0) | https://github.com/nocobase/nocobase | develop / next | Diretório `docs/docs/<lang>/` |
| Site | https://github.com/nocobase/website | main | Veja a Seção III |

Após concluir sua tradução, envie um Pull Request para o NocoBase. Os novos idiomas aparecerão na configuração do sistema, permitindo que você selecione quais idiomas deseja exibir.

![Diagrama de Idiomas Habilitados](https://static-docs.nocobase.com/20250319123452.png)

## Documentação do NocoBase 1.x

Para o guia de tradução do NocoBase 1.x, consulte:

https://docs.nocobase.com/welcome/community/translations
