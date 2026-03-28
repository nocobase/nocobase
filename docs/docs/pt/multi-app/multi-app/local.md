---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/multi-app/multi-app/local).
:::

# Modo de memória compartilhada

## Introdução

Quando você deseja realizar uma separação de domínios de negócio em nível de aplicação, mas não quer introduzir uma arquitetura complexa de implantação e operação, pode utilizar o modo multi-aplicação de memória compartilhada.

Neste modo, várias aplicações podem ser executadas simultaneamente em uma única instância do NocoBase. Cada aplicação é independente, pode se conectar a um banco de dados independente e pode ser criada, iniciada e interrompida individualmente, mas elas compartilham o mesmo processo e espaço de memória, permitindo que você mantenha apenas uma instância do NocoBase.

## Guia de uso

### Configuração de variáveis de ambiente

Antes de utilizar a funcionalidade multi-aplicação, certifique-se de que as seguintes variáveis de ambiente foram definidas ao iniciar o NocoBase:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Criação de aplicação

No menu de configurações do sistema, clique em "App Supervisor" para acessar a página de gerenciamento de aplicações.

![](https://static-docs.nocobase.com/202512291056215.png)

Clique no botão "Adicionar novo" para criar uma nova aplicação.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Explicação dos itens de configuração

| Item de configuração | Descrição |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nome da aplicação** | Nome da aplicação exibido na interface |
| **Identificador da aplicação** | Identificador da aplicação, globalmente único |
| **Modo de inicialização** | - Iniciar no primeiro acesso: a sub-aplicação inicia apenas quando o usuário a acessa pela primeira vez via URL<br>- Iniciar com a aplicação principal: inicia a sub-aplicação simultaneamente ao iniciar a aplicação principal (aumenta o tempo de inicialização da aplicação principal) |
| **Ambiente** | No modo de memória compartilhada, apenas o ambiente local está disponível, ou seja, `local` |
| **Conexão de banco de dados** | Usado para configurar a fonte de dados principal da aplicação, suportando três métodos:<br>- Novo banco de dados: reutiliza o serviço de banco de dados atual para criar um banco de dados independente<br>- Nova conexão de dados: conecta-se a outros serviços de banco de dados<br>- Modo Schema: quando a fonte de dados principal atual é PostgreSQL, cria um Schema independente para a aplicação |
| **Atualização** | Se existirem dados de uma aplicação NocoBase de versão inferior no banco de dados conectado, define se permite a atualização automática para a versão atual da aplicação |
| **Chave JWT** | Gera automaticamente uma chave JWT independente para a aplicação, garantindo que a sessão da aplicação seja independente da aplicação principal e de outras aplicações |
| **Domínio personalizado** | Configura um domínio de acesso independente para a aplicação |

### Inicialização da aplicação

Clique no botão **Iniciar** para iniciar a sub-aplicação.

> Se a opção _"Iniciar no primeiro acesso"_ foi marcada durante a criação, ela será iniciada automaticamente no primeiro acesso.

![](https://static-docs.nocobase.com/202512291121065.png)

### Acesso à aplicação

Clique no botão **Acessar** para abrir a sub-aplicação em uma nova aba.

Por padrão, utiliza-se `/apps/:appName/admin/` para acessar a sub-aplicação, por exemplo:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Além disso, você também pode configurar um domínio independente para a sub-aplicação, sendo necessário apontar o domínio para o IP atual; se estiver usando Nginx, também precisará adicionar o domínio na configuração do Nginx.

### Interrupção da aplicação

Clique no botão **Parar** para interromper a sub-aplicação.

![](https://static-docs.nocobase.com/202512291122113.png)

### Status da aplicação

Você pode visualizar o status atual de cada aplicação na lista.

![](https://static-docs.nocobase.com/202512291122339.png)

### Exclusão de aplicação

Clique no botão **Excluir** para remover a aplicação.

![](https://static-docs.nocobase.com/202512291122178.png)

## Perguntas frequentes

### 1. Gerenciamento de plugins

Os plugins que outras aplicações podem utilizar são os mesmos da aplicação principal (incluindo a versão), mas os plugins podem ser configurados e utilizados de forma independente.

### 2. Isolamento de banco de dados

Outras aplicações podem configurar bancos de dados independentes. Se desejar compartilhar dados entre aplicações, isso pode ser feito através de fontes de dados externas.

### 3. Backup e migração de dados

Atualmente, o backup de dados na aplicação principal não suporta a inclusão de dados de outras aplicações (contém apenas informações básicas da aplicação); é necessário realizar o backup e a migração manualmente dentro das outras aplicações.

### 4. Implantação e atualização

No modo de memória compartilhada, as versões das outras aplicações seguirão automaticamente a atualização da aplicação principal, garantindo a consistência das versões das aplicações.

### 5. Sessão da aplicação

- Se a aplicação usar uma chave JWT independente, a sessão da aplicação será independente da aplicação principal e de outras aplicações. Se acessar diferentes aplicações através de subcaminhos do mesmo domínio, como o TOKEN da aplicação é armazenado no LocalStorage, será necessário fazer login novamente ao alternar entre aplicações. Recomenda-se configurar domínios independentes para diferentes aplicações para obter um melhor isolamento de sessão.
- Se a aplicação não usar uma chave JWT independente, ela compartilhará a sessão da aplicação principal, não sendo necessário fazer login novamente ao retornar à aplicação principal após acessar outras aplicações no mesmo navegador. No entanto, existe um risco de segurança: se os IDs de usuário forem duplicados em diferentes aplicações, isso pode levar ao acesso não autorizado aos dados de outras aplicações.