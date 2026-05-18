# Gerenciamento de Localização

## Introdução

O plugin de Gerenciamento de Localização é usado para gerenciar e implementar os recursos de localização do NocoBase. Ele pode traduzir os menus do sistema, coleções, campos e todos os plugins para se adaptar ao idioma e à cultura de regiões específicas.

## Instalação

Este plugin é um plugin integrado e não requer instalação adicional.

## Instruções de uso

### Ativar o plugin

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Acessar a página de gerenciamento de localização

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Sincronizar termos de tradução

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

Atualmente, o seguinte conteúdo pode ser sincronizado:

- Pacotes de idiomas locais do sistema e plugins
- Títulos de coleções, títulos de campos e rótulos de opções de campos
- Títulos de menus

Após a sincronização, o sistema listará todos os termos traduzíveis para o idioma atual.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Dica}
Diferentes módulos podem ter os mesmos termos originais, que precisam ser traduzidos separadamente.
:::

Se as traduções de entradas integradas do sistema ou dos plugins forem alteradas manualmente ou sobrescritas por tradução de IA, selecione `Redefinir traduções das entradas integradas do sistema` durante a sincronização. Após a sincronização, o sistema substituirá as traduções integradas existentes do idioma atual pelas traduções do pacote de idioma integrado para restaurar a tradução padrão.

### Criar termos automaticamente

Ao editar uma página, os textos personalizados em cada bloco criarão automaticamente os termos correspondentes e gerarão simultaneamente o conteúdo da tradução para o idioma atual.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Dica}
Ao definir textos no código, você precisa especificar manualmente o ns (namespace), como: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Editar conteúdo da tradução

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### Usar tradução com IA

O Gerenciamento de Localização oferece suporte à tradução de entradas por meio da funcionária de IA Lina. Depois de habilitar os funcionários de IA e configurar um serviço de modelo, você pode usar a tradução com IA na página de Gerenciamento de Localização para gerar traduções em lote para o idioma atual.

![](https://static-docs.nocobase.com/202605121152196.png)

Escopos de tradução suportados:

- **Tradução completa**: traduz todas as entradas elegíveis no idioma atual.
- **Tradução incremental**: traduz apenas entradas que ainda não têm tradução.
- **Tradução dos itens selecionados**: selecione entradas na tabela e traduza apenas o conteúdo selecionado.

A tradução com IA cria uma tarefa em segundo plano. Você pode acompanhar o progresso enquanto a tarefa é executada. Após a conclusão, as traduções são gravadas no idioma correspondente e ainda devem ser revisadas e corrigidas de acordo com o contexto real.

Para o guia completo, consulte [Funcionária de IA - Lina](/ai-employees/built-in/lina).

:::warning{title=Observação}
Traduções geradas por IA podem conter desvios semânticos, terminologia inconsistente ou compreensão insuficiente do contexto. Antes de publicar, revise manualmente páginas importantes, termos de negócio e textos voltados aos usuários.
:::

### Publicar tradução

Após concluir a tradução, você precisa clicar no botão "Publicar" para que as alterações entrem em vigor.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Traduzir outros idiomas

Habilite outros idiomas em "Configurações do sistema", por exemplo, Chinês Simplificado.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Mude para esse ambiente de idioma.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Sincronizar termos.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Traduzir e publicar.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>
