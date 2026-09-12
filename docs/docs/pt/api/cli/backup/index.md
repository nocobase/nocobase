---
title: 'nb backup'
description: 'Referência do comando nb backup: cria um backup do NocoBase e faz o download localmente, ou restaura um arquivo de backup local para o env de destino.'
keywords: 'nb backup,NocoBase CLI,backup,restaurar,nbdata'
---

# nb backup

Cria ou restaura um backup do NocoBase. `nb backup create` cria um backup remoto no env de destino e depois baixa o arquivo de backup localmente; `nb backup restore` envia um arquivo de backup local para o env de destino e aguarda até que a aplicação fique pronta novamente.

## Uso

```bash
nb backup <command>
```

## Subcomandos

| Comando                             | Descrição                                                  |
| ----------------------------------- | ---------------------------------------------------------- |
| [`nb backup create`](./create.md)   | Criar um backup e baixá-lo localmente                      |
| [`nb backup restore`](./restore.md) | Restaurar um arquivo de backup local para o env de destino |

## Exemplos

```bash
nb backup create
nb backup create --env app1 --output ./backups
nb backup create --env app1 --output ./backups/result.nbdata
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Observações

Antes da execução, a CLI primeiro verifica se o env de destino expõe os comandos de runtime relacionados a backup. Se algum comando estiver ausente, ela atualiza automaticamente o cache de runtime uma vez; se a capacidade `nb api backup ...` ainda estiver ausente após a atualização, isso significa que o env de destino ainda não habilitou ou sincronizou a capacidade de backup/restore, e nesse caso você precisa primeiro resolver isso na própria aplicação de destino.

Especificamente:

- `nb backup create` depende de `nb api backup create`, `nb api backup status` e `nb api backup download`
- `nb backup restore` depende de `nb api backup restore-upload`

## Comandos relacionados

- [`nb env update`](../env/update.md)
- [`nb app restart`](../app/restart.md)
- [`nb api`](../api/index.md)
