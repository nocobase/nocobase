# Backup e restauração

Se você salvou um aplicativo NocoBase como um ambiente CLI, o backup e a recuperação diários são basicamente concluídos no grupo de comandos `nb backup`. `nb backup create` é usado para criar um backup no ambiente de destino e baixá-lo para o local. `nb backup restore` é usado para restaurar o arquivo de backup local para o ambiente de destino.

Na maioria das vezes, basta lembrar o conselho padrão: faça backup antes de atualizar, migrar ou alterar dados em lote; execute a recuperação somente quando você souber claramente que deseja substituir os dados atuais.

## Índice rápido

| Eu quero... | Qual comando usar |
| --- | --- |
| Primeiro faça backup do ambiente atual para local | [`nb backup create`](../../api/cli/backup/create.md) |
| Salve o backup no diretório especificado | [`nb backup create --output ./backups`](../../api/cli/backup/create.md) |
| Deixe o script continuar consumindo os resultados do backup | [`nb backup create --json-output`](../../api/cli/backup/create.md) |
| Restaurar backup local para ambiente atual | [`nb backup restore --file ./backups/xxx.nbdata --force`](../../api/cli/backup/restore.md) |
| Restaurar backup local para outro ambiente | [`nb backup restore --env app1 --file ./backups/xxx.nbdata --yes --force`](../../api/cli/backup/restore.md) |

:::tip primeiro confirme o ambiente atual

O comando `nb backup` atua no ambiente atual por padrão. Se você mantém vários ambientes ao mesmo tempo, a recomendação padrão é dar uma olhada no ambiente atual antes de executar um backup ou uma restauração.

```bash
nb env current
nb env use app1
```

Se você passar explicitamente um `--env` diferente, a CLI geralmente solicitará confirmação. Em scripts ou cenários não interativos, você pode adicionar `--yes` para pular esta etapa.

:::

## Crie um backup

O uso mais simples é criar um backup diretamente:

```bash
nb backup create
```

Após o comando retornar com sucesso, o arquivo de backup foi baixado localmente. Quando `--output` é omitido, a CLI salva o arquivo no diretório de trabalho atual e usa o nome do arquivo retornado pela extremidade remota – geralmente `backup_*.nbdata`.

Se quiser colocar os backups em um diretório, você pode usar isto:

```bash
nb backup create --output ./backups
```

Se `./backups` já existir e for um diretório, a CLI anexará automaticamente o nome do arquivo de backup remoto ao diretório. Somente se o caminho não existir, a CLI o tratará como o caminho do arquivo de destino.

Se quiser continuar consumindo resultados de backup em scripts, CI ou links de agente, você pode adicionar `--json-output`:

```bash
nb backup create --env app1 --yes --json-output
```

Nesse modo, a CLI não gera mais texto de progresso, mas retorna diretamente o JSON final, que geralmente contém três campos: `env`, `name` e `output`.

## Restaurar backup

O comando de restauração fará upload do arquivo de backup local para o ambiente de destino e substituirá os dados atuais do aplicativo:

```bash
nb backup restore --file ./backups/backup_20260520_190408_8397.nbdata --force
```

Se você deseja restaurar para algo diferente do ambiente atual, geralmente é mais seguro escrever assim:

```bash
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::nota de aviso

A recuperação é uma operação de cobertura total. Por padrão, é recomendado fazer outro backup do ambiente de destino atual antes de restaurar.

```bash
nb backup create --env app1 --yes --output ./backups
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::

`nb backup restore` irá primeiro verificar se o caminho apontado por `--file` existe e confirmar se é um arquivo normal. Depois que o upload for bem-sucedido, a CLI continuará aguardando que o aplicativo passe novamente na verificação de integridade; portanto, quando o comando retornar com êxito, o aplicativo geralmente terá sido restaurado para um estado acessível.

Se `--force` não for passado, o terminal interativo solicitará novamente a confirmação. Em terminais não interativos, scripts e sessões de agente de IA, `--force` é necessário.

## Situações comuns

Se você está mais acostumado a operar na interface ou precisa de recursos como backup agendado e sincronização de armazenamento em nuvem, consulte diretamente [Gerenciamento de backup](../../ops-management/backup-manager/index.mdx). Nesses cenários, a UI da Web costuma ser mais adequada.

## Links relacionados

- [`nb backup` Referência de comando](../../api/cli/backup/index.md)
- [`nb env` Referência de comando](../../api/cli/env/index.md)
- [Gerenciamento de vários ambientes](./multi-environment.md)
- [Gerenciamento de backup](../../ops-management/backup-manager/index.mdx)
