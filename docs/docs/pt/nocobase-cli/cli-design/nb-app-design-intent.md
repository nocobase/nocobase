# nb intenção de design do aplicativo

Os comandos relacionados a `nb app` são essencialmente adaptações baseadas em diferentes métodos de gerenciamento de processos e, em seguida, unificados em um conjunto de entradas de gerenciamento de aplicativos estáveis. O objetivo é tentar convergir o uso mental durante a operação e manutenção diária para um conjunto de comandos.

Atualmente, os métodos de gerenciamento de processos de aplicativos suportados pela CLI incluem principalmente:

- Docker
-PM2

Se precisarmos suportar mais métodos no futuro, como o Supervisor, continuaremos a fazer adaptações nesta camada. A entrada de comando de alta frequência exposta ao mundo exterior permanece a mesma:

```bash
nb app start
nb app restart
nb app logs
nb app upgrade
nb app stop
```

## Por que deveríamos unificá-lo em `nb app`

O gerenciamento de processos pode ser implementado de várias maneiras, mas para a maioria dos usuários, o que realmente importa não é o que é usado na camada inferior, mas as ações específicas de "Quero iniciar o aplicativo", "Quero ler o log" e "Quero atualizar o aplicativo".

Se as diferenças subjacentes forem expostas diretamente, os usuários precisam primeiro determinar qual modo operacional estão usando no momento e, em seguida, lembrar o conjunto correspondente de métodos operacionais. Após serem unificadas em `nb app`, essas ações de alta frequência podem convergir para um conjunto de entradas estáveis.

### Reduza os custos de aprendizagem

Diferentes soluções de gerenciamento de processos operam de maneiras diferentes:

- Docker possui o sistema de comando do Docker
- PM2 possui sistema de comando PM2
- O Supervisor também possui seu próprio método de configuração

Se essas diferenças forem expostas diretamente, os usuários precisarão aprender vários métodos de uso e será mais fácil perder etapas importantes em cenários de alta frequência, como atualizações, reinicializações e solução de problemas de log.

Após a unificação como `nb app`, a maior parte do gerenciamento diário requer apenas o domínio de um conjunto de comandos.

### Unifique processos de negócios

O gerenciamento do ciclo de vida do aplicativo não envolve apenas o gerenciamento de processos.

Em processos como inicialização, atualização e parada, a CLI geralmente precisa lidar com lógica adicional, como:

- Inspeção ambiental
- Processamento de configuração
- Migração de dados
- Atualização de versão
- Gerenciamento de registros

Ao usar `nb app` como entrada unificada, você pode garantir que os comportamentos desses processos sejam consistentes. Se você continuar a expandir suas capacidades no futuro, não precisará reaprender uma nova operação e manutenção.

## Por que `nb app autostart` ainda é necessário?

Depois de ter uma entrada unificada de gerenciamento de processos, outra camada de capacidade de "gerenciamento de inicialização automática" precisa ser adicionada para completar todo o processo. É por isso que `nb app autostart` existe.

O uso comum é:

```bash
# 为当前 env 开启自启动
nb app autostart enable

# 为指定 env 开启自启动
nb app autostart enable --env app1

# 查看自启动状态
nb app autostart list

# 启动所有已开启自启动的 env
nb app autostart run

# 启动时显示底层启动输出
nb app autostart run --verbose
```

O foco deste conjunto de ordens é continuar a manter a unidade externamente. Em outras palavras, na mente do usuário nesta camada de `nb app`, você não precisa se preocupar se a camada inferior é Docker, PM2 ou outros métodos que possam ser suportados no futuro. O método de operação unificada externa ainda é semelhante a:

```bash
nb app autostart enable --env app1
nb app autostart disable --env app1
```

### `run` A que essa camada se adapta?

`nb app autostart` também está dividido em dois níveis de responsabilidades:

- `enable` / `disable` são responsáveis por gerenciar se um determinado ambiente permite inicialização automática
- `run` é responsável por puxar todos os ambientes que possuem inicialização automática habilitada durante a fase de inicialização do sistema.

Em outras palavras, a CLI também fornecerá uma entrada `run` unificada para fornecer acesso ao mecanismo de inicialização automática do sistema:

```bash
nb app autostart run
```

O que é adaptado aqui são os mecanismos de inicialização do sistema, como `systemd`, `launchd`, e scripts de inicialização do host, e não os gerenciadores de processos de aplicativos, como o Supervisor.

## Geral

- Os comandos relacionados a `nb app` são essencialmente uma camada de adaptação sobre diferentes métodos de gerenciamento de processos. Após serem unificados externamente, podem reduzir a confusão mental do usuário.
- A implementação do gerenciamento de processos pode ser Docker, PM2, Supervisor, etc. Atualmente, Docker e PM2 são suportados
- Como as configurações de inicialização automática de diferentes métodos de gerenciamento de processos são diferentes, é necessário um conjunto unificado de recursos `nb app autostart` para que todo o processo seja concluído.

Se quiser continuar a ver as operações diárias, você pode ir diretamente para [Gerenciar aplicativo](../operations/manage-app.md). Se você estiver pronto para implantar o aplicativo no ambiente formal, poderá continuar consultando [Implantação do ambiente de produção](../production/index.md).
