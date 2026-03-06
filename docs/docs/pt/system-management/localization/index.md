:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/system-management/localization/index).
:::

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

### Criar termos automaticamente

Ao editar uma página, os textos personalizados em cada bloco criarão automaticamente os termos correspondentes e gerarão simultaneamente o conteúdo da tradução para o idioma atual.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Dica}
Ao definir textos no código, você precisa especificar manualmente o ns (namespace), como: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Editar conteúdo da tradução

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

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