#Gerenciamento de múltiplos ambientes

Se você mantiver vários aplicativos NocoBase, como `dev`, `test`, `staging`, `prod`, etc., poderá salvá-los como ambiente CLI, respectivamente. A maioria dos comandos `nb` futuros atuarão no ambiente atual por padrão, por isso é importante confirmar qual ambiente você está usando antes de executar comandos como `nb app`, `nb api` e `nb db`.

A partir desta versão, a CLI divide o conceito em `current env` e `last env`. Normalmente, você só precisa se preocupar com `current env` - que é o ambiente que o shell atual ou o tempo de execução do agente está usando. A CLI retornará para `last env` global somente quando o modo de sessão não estiver habilitado.

## Índice rápido

| Eu quero... | Qual comando usar |
| --- | --- |
| Crie um novo ambiente local e conclua a inicialização sem problemas | [`nb init`](../../api/cli/init.md) |
| Registre um aplicativo existente como CLI env | [`nb env add`](../../api/cli/env/add.md) |
| Veja quais ambientes são salvos localmente | [`nb env list`](../../api/cli/env/list.md) |
| Verifique o status de conectividade e autenticação de todos os ambientes | [`nb env status --all`](../../api/cli/env/status.md) |
| Mude o ambiente a ser usado pelos comandos subsequentes | [`nb env use`](../../api/cli/env/use.md) |
| Confirme em qual ambiente o comando atual se enquadrará | [`nb env current`](../../api/cli/env/current.md) e [`nb env status`](../../api/cli/env/status.md) |
| Veja configurações detalhadas salvas por um ambiente | [`nb env info`](../../api/cli/env/info.md) |
| Atualize a configuração do ambiente salva, permitindo que a CLI ressincronize o estado atual, se necessário | [`nb env update`](../../api/cli/env/update.md) |
| Autentique novamente após o estado de login expirar ou use um novo método de autenticação | [`nb env auth`](../../api/cli/env/auth.md) |
| Exclua configurações de ambiente não utilizadas e limpe recursos hospedados locais, se necessário | [`nb env remove`](../../api/cli/env/remove.md) |

:::tip É recomendado ativar o modo de sessão primeiro

Por padrão, é recomendado executar [`nb session setup`](../../api/cli/session/setup.md) primeiro. Dessa forma, diferentes terminais, diferentes shells ou diferentes tempos de execução de agentes podem manter seu próprio `current env` e não afetarão facilmente uns aos outros durante operações paralelas.

Se o modo de sessão não estiver ativado, `nb env use` voltará para a atualização global de `last env`. Neste caso, se um terminal isolar o meio ambiente, o outro terminal também poderá ser afetado.

```bash
nb session setup
```

:::

## Crie vários ambientes

Se você deseja criar ou restaurar um aplicativo local, basta usar `nb init`. Ele concluirá a inicialização e salvará os resultados em um novo ambiente CLI.

```bash
nb init --env dev
nb init --env test
```

Se a aplicação já existe e você deseja apenas conectá-la à CLI, geralmente é mais simples usar `nb env add`:

```bash
nb env add staging --api-base-url http://staging.example.com/api --auth-type oauth
nb env add prod --api-base-url https://api.example.com/api --auth-type token --access-token <token>
```

O primeiro trata mais de "inicializar um ambiente", enquanto o último trata mais de "registrar um ambiente existente". Se você estiver apenas se conectando a um aplicativo existente, use `nb env add` por padrão.

## Visualize o ambiente configurado

Primeiro use `nb env list` para ver quais ambientes foram salvos localmente:

```bash
nb env list
```

Este comando exibe apenas a configuração em si e não verifica ativamente o status do aplicativo. Quando quiser ver o status de conectividade e autenticação, use `nb env status --all`:

```bash
nb env status --all
```

Normalmente você verá valores de status como `ok`, `auth failed`, `unreachable`.

## Mude o ambiente atual

Use `nb env use` para alternar ambientes:

```bash
nb env use dev
```

Depois que a troca for concluída, os comandos subsequentes que omitirem `--env` usarão esse env por padrão.

## Verifique o ambiente atual

Se você não tiver certeza de qual ambiente o comando atual se enquadrará, execute estes dois comandos primeiro:

```bash
nb env current
nb env status
```

`nb env current` é usado para ver o nome, `nb env status` é usado para ver se o ambiente atual está acessível e a autenticação é normal.

## Ver detalhes de um único ambiente

Se você quiser ver quais configurações estão salvas em um determinado ambiente, use `nb env info`:

```bash
nb env info dev
nb env info dev --json
nb env info dev --field app.url
nb env info dev --show-secrets
```

Entre eles, `--field` é adequado para assumir apenas um valor no script. `--show-secrets` exibirá informações confidenciais, como tokens e senhas, em texto simples. Use-os somente quando for claramente necessário solucionar problemas.

## Atualizar configuração do ambiente

`nb env update` é usado para ajustar a configuração de um ambiente salvo. Como endereço API, método de autenticação, código-fonte, porta do aplicativo e parâmetros de banco de dados. Assim que a atualização for concluída, a CLI tratará automaticamente das etapas de acompanhamento com base nas alterações.

Se você deseja apenas que a CLI seja ressincronizada de acordo com o estado mais recente do ambiente atual, basta escrever assim:

```bash
nb env update
nb env update prod
```

Se quiser modificar as informações de conexão ou configuração local salvas por este ambiente, você pode trazer explicitamente os parâmetros:

```bash
nb env update prod --api-base-url https://api.example.com/api
nb env update prod --access-token <token>
nb env update dev --app-port 13080 --timezone Asia/Shanghai
```

Aqui você pode primeiro lembrar um julgamento padrão:

- Para modificar as informações de conexão ou configuração local salvas pelo env, use `nb env update`
- A interface do aplicativo, plug-in ou recursos disponíveis CLI acabaram de mudar, você também pode executar `nb env update` novamente
- O status de login expirou ou você precisa passar pelo processo de autenticação novamente, use `nb env auth`
- Só para ver o que está salvo atualmente, use `nb env info`

Se você alterar as configurações de execução locais, como `app-port`, `timezone` e `db-*`, `update` alterará apenas o valor salvo e não reiniciará automaticamente o aplicativo. De modo geral, `nb app restart --env <name>` será executado posteriormente; se a mudança envolver o banco de dados integrado gerenciado pela CLI, use `nb app restart --env <name> --with-db`.

## Reautenticação

Se o env foi salvo, mas o estado de login expirou ou você deseja mudar o método de autenticação, você pode autenticar novamente:

```bash
nb env auth
nb env auth prod
nb env auth prod --auth-type oauth
nb env auth prod --auth-type basic --username admin --password secret
nb env auth prod --auth-type token --access-token <api-key>
```

Quando o nome do ambiente é omitido, a CLI usa o ambiente atual. Assim que a autenticação for concluída, a CLI tratará automaticamente da sincronização subsequente.

## Remover ambiente

Esses cenários são os mais confusos. Você pode primeiro lembrar uma sugestão padrão:

- Se você quiser apenas parar o aplicativo, use `nb app stop`
- Também quero interromper o tempo de execução do banco de dados integrado na máquina atual, use `nb app stop --with-db`
- Se você tem certeza de que este ambiente não é mais necessário, mas deseja manter o armazenamento e os arquivos locais do aplicativo primeiro, use `nb env remove`
- Limpe até mesmo os recursos de hospedagem local e use `nb env remove --purge`

Se você deseja apenas remover a configuração de ambiente salva:

```bash
nb env remove staging
```

Se for um ambiente local ou hospedado no Docker e você também quiser limpar os recursos em execução e os dados de armazenamento na máquina local, poderá adicionar `--purge`:

```bash
nb env remove test --purge
```

No modo não interativo, `nb env remove` precisa ser passado explicitamente em `--force`:

```bash
nb env remove test --purge --force
```

`--purge` limpará apenas os recursos gerenciados pela CLI na máquina atual. Para ambiente de API remoto, ele não excluirá o próprio serviço remoto.

Se você quiser apenas parar o aplicativo e o banco de dados integrado gerenciado pela CLI, basta escrever:

```bash
nb app stop --env app1 --with-db
```

Se você deseja remover este ambiente, mas ainda deseja manter o armazenamento e os arquivos locais do aplicativo:

```bash
nb env remove app1 --force
```

Se você realmente deseja limpar o conteúdo hospedado nativamente deste ambiente, adicione `--purge`:

```bash
nb env remove app1 --purge --force
```

Para ambiente npm/Git local gerenciado por downloads CLI, `--purge` também exclui arquivos de aplicativos locais hospedados pela CLI. Para ambiente HTTP ou SSH, ele excluirá apenas a configuração de ambiente salva na CLI e não excluirá o serviço externo em si.

## Links relacionados

- [`nb env` Referência de comando](../../api/cli/env/index.md)
- [`nb env update`](../../api/cli/env/update.md)
- [`nb session` Referência de comando](../../api/cli/session/index.md)
- [nb intenção de design do aplicativo](../cli-design/nb-app-design-intent.md)
- [Gerenciar aplicativo](./manage-app.md)
