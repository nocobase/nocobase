---
title: "nb env remove"
description: "Referência do comando nb env remove: interrompe o runtime gerenciado antes de remover a configuração do env, ou limpa recursos locais do CLI quando necessário."
keywords: "nb env remove,NocoBase CLI,excluir ambiente,remover configuração,purge"
---

# nb env remove

Remove um env já configurado. Para envs locais e Docker, este comando primeiro interrompe nesta máquina o runtime da aplicação e o runtime do banco de dados embutido gerenciados pelo CLI e depois remove a configuração salva do env. Para envs HTTP e SSH, ele apenas remove a configuração salva do env.

Se o env removido também for o env atual, a CLI seleciona automaticamente um novo env atual a partir dos envs restantes. Se não restar nenhum env, o env atual será limpo.

Por padrão, o comando solicita confirmação. No modo não interativo, `--force` é obrigatório antes da execução.

Passe `--purge` para também limpar os recursos gerenciados pelo CLI nesta máquina. Para envs locais e Docker, `--purge` executa a mesma limpeza de [`nb app destroy`](../app/destroy.md). Para envs HTTP e SSH, `--purge` não toca serviços externos e apenas remove a configuração salva do env.

## Uso

```bash
nb env remove <name> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<name>` | string | Nome do ambiente configurado a ser removido |
| `--force`, `-f` | boolean | Pula a confirmação do modo de remoção selecionado; obrigatório no modo não interativo |
| `--purge` | boolean | Também remove recursos locais gerenciados pelo CLI, dados de storage e, quando aplicável, arquivos locais da app baixados. Para envs de API remota, apenas a configuração salva do env é removida |
| `--verbose` | boolean | Exibe o progresso detalhado |

## Exemplos

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Comandos relacionados

- [`nb app stop`](../app/stop.md)
- [`nb app destroy`](../app/destroy.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
