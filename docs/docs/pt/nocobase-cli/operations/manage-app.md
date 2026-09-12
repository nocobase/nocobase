#Gerenciar aplicativos

Se você salvou um aplicativo NocoBase como um ambiente CLI, o gerenciamento diário é basicamente concluído no grupo de comandos `nb app`: iniciar, parar, reiniciar, visualizar logs e atualizar.

Na maioria das vezes, você não precisa se lembrar de todos os parâmetros. Primeiro deixe claro se o que você deseja fazer é “executar o aplicativo”, “ler os logs para solucionar problemas” ou “atualizar para uma nova versão” e, em seguida, selecionar o comando correspondente.

Se você quiser primeiro entender por que `nb app` é unificado neste conjunto de comandos e sua relação com `nb app autostart`, primeiro leia [nb app design intent](../cli-design/nb-app-design-intent.md). Esta página contém apenas as operações diárias mais comuns.

## Índice rápido

| Eu quero... | Qual comando usar |
| --- | --- |
| Iniciar ou retomar a operação do aplicativo | [`nb app start`](../../api/cli/app/start.md) |
| Pare temporariamente o aplicativo | [`nb app stop`](../../api/cli/app/stop.md) |
| Pare com o banco de dados integrado gerenciado por CLI | [`nb app stop --with-db`](../../api/cli/app/stop.md) |
| Reinicie a aplicação após modificar a configuração | [`nb app restart`](../../api/cli/app/restart.md) |
| Visualize logs de aplicativos em tempo real | [`nb app logs`](../../api/cli/app/logs.md) |
| Atualizar para uma nova fonte ou versão de imagem | [`nb app upgrade`](../../api/cli/app/upgrade.md) |

:::tip primeiro confirme o ambiente atual

O comando `nb app` atua no ambiente atual por padrão. Se você mantiver vários ambientes ao mesmo tempo, é recomendado, por padrão, confirmar o ambiente de destino antes de iniciar, parar, registrar em log ou atualizar operações.

Se você passar explicitamente um `--env` diferente, a CLI geralmente solicitará confirmação. Em scripts ou cenários não interativos, você pode adicionar `--yes` para pular esta etapa. A comutação, visualização e remoção de vários ambientes são introduzidas em [Gerenciamento de vários ambientes](./multi-environment.md).

:::

## Iniciar aplicativo

Abra o aplicativo e use `nb app start` por padrão:

```bash
nb app start
```

Se quiser operar em algo diferente do ambiente atual, você pode especificá-lo explicitamente:

```bash
nb app start --env app1 --yes
```

Vários outros parâmetros de inicialização comumente usados:

- `nb app start` Por padrão, a instalação necessária ou os preparativos de atualização serão concluídos automaticamente primeiro e, em seguida, o serviço será iniciado.

O ambiente npm/Git local iniciará o processo de aplicativo local e o ambiente Docker reconstruirá o contêiner do aplicativo de acordo com a configuração salva. Para parâmetros detalhados, consulte [`nb app start`](../../api/cli/app/start.md).

## Pare e reinicie

Se você quiser apenas interromper o aplicativo temporariamente, use `nb app stop`:

```bash
nb app stop
```

Se você acabou de alterar a configuração, as dependências ou o código, geralmente é mais fácil usar `nb app restart` diretamente:

```bash
nb app restart
nb app restart --env app1 --yes
```

`nb app restart` será interrompido primeiro e depois reiniciado da mesma forma que `start`. Para uso detalhado, consulte [`nb app stop`](../../api/cli/app/stop.md) e [`nb app restart`](../../api/cli/app/restart.md).

## Ver registro

Ao solucionar problemas, você geralmente olha primeiro os logs:

```bash
nb app logs
```

Se você quiser apenas ver a saída mais recente ou não quiser continuar acompanhando o log, você pode usar isto:

```bash
nb app logs --tail 200
nb app logs --no-follow
nb app logs --env app1 --yes
```

O ambiente npm/Git local lê logs pm2 e o ambiente Docker lê logs de contêiner. Por padrão, `nb app logs` continuará a seguir a nova saída de log. Para parâmetros detalhados, consulte [`nb app logs`](../../api/cli/app/logs.md).

## Atualizar aplicativo

O comando de atualização é `nb app upgrade`:

```bash
nb app upgrade
```

Este comando faz mais do que apenas “baixar a nova versão”. O processo padrão geralmente inclui:

1. Pare o aplicativo atual
2. Baixe e substitua o código-fonte ou imagem salva
3. Sincronize plug-ins comerciais
4. Atualize e inicie o aplicativo
5. Atualize as informações de tempo de execução do ambiente

Se você atualizou o código-fonte ou a imagem antecipadamente e deseja apenas continuar a atualização e iniciar o aplicativo com base no conteúdo atual, você pode adicionar `--skip-download`:

```bash
nb app upgrade --skip-download
```

Se quiser especificar explicitamente a versão de destino, você também pode adicionar `--version`:

```bash
nb app upgrade --version beta
```

:::nota de aviso

`nb app upgrade` Normalmente, você também será solicitado a confirmar uma vez antes de começar. Em scripts, CI ou outros cenários não interativos, `--force` precisa ser transmitido explicitamente. Se você também opera em ambientes ao mesmo tempo, geralmente precisará reunir `--yes`.

```bash
nb app upgrade --env app1 --yes --force
```

:::

Para obter uma descrição mais completa dos parâmetros, consulte [`nb app upgrade`](../../api/cli/app/upgrade.md).

## Links relacionados

- [nb intenção de design do aplicativo](../cli-design/nb-app-design-intent.md)
- [Gerenciamento de vários ambientes](./multi-environment.md)
- [`nb app` Referência de comando](../../api/cli/app/index.md)
