---
pkg: '@nocobase/plugin-version-control'
title: "Controle de versão"
description: "Guia do plugin de controle de versão: salvar versões automaticamente durante a criação com IA, criar e restaurar versões manualmente, configurar retenção, atalho e coleções de usuário incluídas."
keywords: "Controle de versão,Version control,gestão operacional,AI Builder,nocobase-revision,nb revision create,criar versão,restaurar versão,NocoBase"
---

# Controle de versão

No NocoBase, **Controle de versão** permite salvar uma versão restaurável da aplicação atual. Você pode criar versões manualmente, restaurar uma versão salva quando precisar e permitir que o AI Builder salve versões automaticamente após marcos significativos.

O controle de versão depende de [Gerenciamento de backups](../backup-manager/index.mdx) para salvar e restaurar estados da aplicação. Antes de usar o controle de versão, habilite primeiro o Gerenciamento de backups.

:::warning Atenção

As edições Community e Standard não incluem o plugin de controle de versão. Se você precisa salvar um estado restaurável da aplicação, use [Gerenciamento de backups](../backup-manager/index.mdx): crie um backup manual antes de mudanças importantes e restaure o backup correspondente quando precisar voltar atrás.

:::

## Versões automáticas com IA

Depois que o plugin de controle de versão é habilitado, o AI Builder ganha uma camada extra de recuperação. Quando um AI Agent começa a trabalhar em uma solicitação, ele verifica as NocoBase Skills disponíveis para a aplicação atual. Se encontrar a skill `nocobase-revision`, pode salvar marcos importantes de criação como versões restauráveis.

![A IA detecta a skill nocobase-revision ao iniciar a criação](https://static-docs.nocobase.com/20260611115845.png)

Quando a IA conclui uma parte que pode ser revisada separadamente, como montar uma página, criar um conjunto de coleções ou configurar um workflow, ela executa `nb revision create` por meio do NocoBase CLI. Você não precisa clicar manualmente em 「Create version」 a cada vez, e pequenos ajustes não geram registros de versão em excesso.

![A IA cria uma versão após a criação](https://static-docs.nocobase.com/20260611115804.png)

Essas versões aparecem na lista de versões. Se as alterações seguintes não ficarem como esperado, você pode restaurar o marco anterior e continuar ajustando a partir dele.

## Abrir o plugin

Depois de habilitar o plugin, o menu 「Version control」 aparece na barra superior. A partir dele, você pode criar uma versão diretamente ou ir para a lista de versões.

Você também pode abrir a página do plugin em 「System settings / Version control」. O atalho padrão para criar uma versão é `Ctrl + K`, e você pode alterá-lo na aba de configurações.

![Menu Version control](https://static-docs.nocobase.com/20260611112317.png)

## Criar uma versão

Clique em 「Create version」, preencha uma descrição e salve. A descrição pode ter até 2000 caracteres. Ela é útil para registrar o contexto da alteração, como “Ajuste dos campos e permissões do fluxo de aprovação”.

![Criar uma versão](https://static-docs.nocobase.com/20260611112739.png)

Depois de clicar em salvar, a lista mostra primeiro um item temporário em estado “Saving”. Quando termina, a versão salva aparece na lista.

Pontos principais:

- O nome da versão é gerado automaticamente
- Criar pela barra superior, pelo atalho ou pela página da lista produz o mesmo resultado
- A lista mostra nome da versão, descrição, tamanho do arquivo, hora de criação, criador e ações disponíveis

## Gerenciar e restaurar versões

A lista de versões oferece principalmente estas ações:

- 「Refresh」 recarrega a lista atual
- 「Delete」 remove uma versão ou várias versões selecionadas
- 「Restore」 restaura a aplicação para o estado salvo naquela versão

:::warning Atenção

Restaurar uma versão sobrescreve a configuração atual da aplicação e os dados incluídos naquela versão. Recomenda-se criar antes uma versão do estado atual, para que você possa voltar atrás se precisar.

:::

Depois de clicar em 「Restore」, a aplicação entra em modo de manutenção por um curto período enquanto a restauração é executada. Não envie outra restauração durante esse processo. Se a restauração falhar, a interface mostrará uma notificação de erro.

## Configurar as regras de versão

Abra a aba 「Settings」 para controlar retenção e conteúdo de cada versão.

![](https://static-docs.nocobase.com/20260526220720.png)

As configurações incluem:

- `Versions to keep`: número máximo de versões salvas. As versões mais antigas são removidas automaticamente quando o limite é excedido
- `Shortcut: create version`: atalho para criar uma versão. Pressione `Ctrl + uma letra` para definir e `Backspace` para limpar
- `User collections`: escolha quais dados de coleções criadas por usuários devem ser incluídos nas versões salvas

:::tip

Por padrão, as versões salvas não incluem dados de coleções criadas por usuários. Você só precisa selecionar coleções aqui quando quiser restaurar também parte dos dados de negócio.

:::

Se você incluir uma coleção de usuário, o NocoBase também incluirá automaticamente as coleções relacionadas, então a restauração costuma ficar mais completa.

## Links relacionados

- [Gerenciamento de backups](../backup-manager/index.mdx) — capacidade básica exigida pelo controle de versão
- [Gerenciamento de migrações](../migration-manager/index.md) — mover a configuração da aplicação entre ambientes
- [Gerenciamento de publicações](../release-management/index.md) — planejar fluxos de publicação com backups, migrações e variáveis
- [Início Rápido do Construtor de IA](../../ai-builder/index.md) — usar linguagem natural para modelagem de dados, configuração de páginas e orquestração de workflows
