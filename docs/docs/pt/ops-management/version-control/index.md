---
title: "Controle de versão"
description: "Guia do plugin de controle de versão: criar versões, restaurar versões, configurar retenção, atalho e coleções de usuário incluídas."
keywords: "Controle de versão,Version control,gestão operacional,criar versão,restaurar versão,NocoBase"
---

# Controle de versão

No NocoBase, **Controle de versão** permite salvar uma versão restaurável da aplicação atual. Você pode criar versões manualmente, restaurar uma versão salva quando precisar e usar as configurações do plugin para controlar quantas versões manter, qual atalho usar e quais coleções de usuário devem ser salvas junto com a versão.

Ele depende de [Gerenciamento de backups](../backup-manager/index.mdx). Se o plugin de controle de versão já estiver habilitado, mas o sistema ainda mostrar erros relacionados, confirme primeiro que o Gerenciamento de backups também está habilitado.

## Abrir o plugin

Você pode abrir o plugin em 「System settings」 → 「Version control」. Um botão de controle de versão também aparece na barra superior. A partir dele, você pode criar uma versão diretamente ou ir para a lista de versões. O atalho padrão para criar uma versão é `Ctrl + K`, e você pode alterá-lo na aba de configurações.

![](https://static-docs.nocobase.com/20260526220402.png)

## Criar uma versão

Clique em 「Create version」, preencha uma descrição e salve. A descrição pode ter até 2000 caracteres. Ela é útil para registrar o contexto da alteração, como “Ajuste dos campos e permissões do fluxo de aprovação”.

![](https://static-docs.nocobase.com/20260526220510.png)

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
