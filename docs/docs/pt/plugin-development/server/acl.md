:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Controle de Acesso ACL

ACL (Access Control List) é usado para controlar as permissões de operação de recursos. Você pode conceder permissões a funções, ou ignorar as restrições de função e definir permissões diretamente. O sistema ACL oferece um mecanismo flexível de gerenciamento de permissões, suportando fragmentos de permissão (snippets), middlewares, avaliação condicional e outros métodos.

:::tip Dica

Objetos ACL pertencem às **fontes de dados** (`dataSource.acl`). O ACL da fonte de dados principal pode ser acessado rapidamente via `app.acl`. Para o uso de ACLs de outras fontes de dados, consulte o capítulo [Gerenciamento de Fontes de Dados](./data-source-manager.md).

:::

## Registrar Fragmentos de Permissão (Snippets)

Fragmentos de permissão (Snippets) permitem registrar combinações de permissões comuns como unidades reutilizáveis. Depois que uma função é vinculada a um snippet, ela obtém o conjunto correspondente de permissões, o que reduz a configuração duplicada e melhora a eficiência do gerenciamento de permissões.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // O prefixo ui.* indica permissões que podem ser configuradas na interface.
  actions: ['customRequests:*'], // Operações de recurso correspondentes, suporta curingas.
});
```

## Permissões que Ignoram Restrições de Função (allow)

`acl.allow()` é usado para permitir que certas operações ignorem as restrições de função. Isso é útil para APIs públicas, cenários que exigem avaliação dinâmica de permissões ou casos em que o julgamento de permissão precisa ser baseado no contexto da requisição.

```ts
// Acesso público, sem necessidade de login
acl.allow('app', 'getLang', 'public');

// Acessível apenas para usuários logados
acl.allow('app', 'getInfo', 'loggedIn');

// Baseado em uma condição personalizada
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**Descrição do parâmetro `condition`:**

- `'public'`：Qualquer usuário (incluindo usuários não autenticados) pode acessar, sem necessidade de autenticação.
- `'loggedIn'`：Apenas usuários logados podem acessar, requer uma identidade de usuário válida.
- `(ctx) => Promise<boolean>` ou `(ctx) => boolean`：Função personalizada que determina dinamicamente se o acesso é permitido com base no contexto da requisição, podendo implementar lógicas de permissão complexas.

## Registrar Middleware de Permissão (use)

`acl.use()` é usado para registrar middlewares de permissão personalizados, permitindo inserir lógica personalizada no fluxo de verificação de permissões. Geralmente, é usado em conjunto com `ctx.permission` para regras de permissão personalizadas. É adequado para cenários que exigem controle de permissão não convencional, como formulários públicos que precisam de verificação de senha personalizada, ou verificações de permissão dinâmicas baseadas em parâmetros de requisição.

**Cenários de aplicação típicos:**

- Cenários de formulário público: Sem usuário e sem função, mas as permissões precisam ser restritas por meio de uma senha personalizada.
- Controle de permissões baseado em parâmetros de requisição, endereços IP e outras condições.
- Regras de permissão personalizadas, ignorando ou modificando o fluxo de verificação de permissões padrão.

**Controlar permissões através de `ctx.permission`:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Exemplo: Formulário público precisa de verificação de senha para ignorar a verificação de permissão.
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Verificação aprovada, ignorar verificação de permissão.
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Executar verificação de permissão (continuar fluxo ACL).
  await next();
});
```

**Descrição das propriedades de `ctx.permission`:**

- `skip: true`：Ignora as verificações de permissão ACL subsequentes e permite o acesso diretamente.
- Pode ser definido dinamicamente no middleware com base em lógica personalizada para obter controle de permissões flexível.

## Adicionar Restrições de Dados Fixas para Operações Específicas (addFixedParams)

`addFixedParams` pode adicionar restrições de escopo de dados fixos (filtro) para operações de certos recursos. Essas restrições ignoram as limitações de função e são aplicadas diretamente, geralmente usadas para proteger dados críticos do sistema.

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// Mesmo que um usuário tenha permissão para excluir funções, ele não poderá excluir funções do sistema como root, admin ou member.
```

> **Dica:** `addFixedParams` pode ser usado para evitar que dados sensíveis sejam acidentalmente excluídos ou modificados, como funções internas do sistema, contas de administrador, etc. Essas restrições funcionam em conjunto com as permissões de função, garantindo que, mesmo com permissões, os dados protegidos não possam ser manipulados.

## Verificar Permissões (can)

`acl.can()` é usado para verificar se uma determinada função tem permissão para executar uma operação específica, retornando um objeto de resultado de permissão ou `null`. É comumente usado para verificar permissões dinamicamente na lógica de negócios, por exemplo, em middlewares ou handlers de operações, para decidir se certas operações são permitidas com base na função.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Pode-se passar uma única função ou um array de funções.
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`A função ${result.role} pode executar a operação ${result.action}.`);
  // result.params contém os parâmetros fixos definidos via addFixedParams.
  console.log('Parâmetros fixos:', result.params);
} else {
  console.log('Sem permissão para executar esta operação.');
}
```

> **Dica:** Se você passar várias funções, cada uma será verificada sequencialmente, e o resultado da primeira função com permissão será retornado.

**Definições de Tipo:**

```ts
interface CanArgs {
  role?: string;      // Função única
  roles?: string[];   // Múltiplas funções (verificadas sequencialmente, retorna a primeira função com permissão)
  resource: string;   // Nome do recurso
  action: string;    // Nome da operação
}

interface CanResult {
  role: string;       // Função com permissão
  resource: string;   // Nome do recurso
  action: string;    // Nome da operação
  params?: any;       // Informações de parâmetros fixos (se definidos via addFixedParams)
}
```

## Registrar Operações Configuráveis (setAvailableAction)

Se você deseja que operações personalizadas possam ter suas permissões configuradas na interface (por exemplo, exibidas na página de gerenciamento de funções), você precisa registrá-las usando `setAvailableAction`. As operações registradas aparecerão na interface de configuração de permissões, onde os administradores podem configurar as permissões de operação para diferentes funções.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Nome de exibição na interface, suporta internacionalização.
  type: 'new-data',               // Tipo de operação.
  onNewRecord: true,              // Se deve ter efeito ao criar novos registros.
});
```

**Descrição dos parâmetros:**

- **displayName**: Nome exibido na interface de configuração de permissões, suporta internacionalização (usando o formato `{{t("key")}}`).
- **type**: Tipo de operação, que determina a classificação desta operação na configuração de permissões.
  - `'new-data'`: Operações que criam novos dados (como importação, adição, etc.).
  - `'existing-data'`: Operações que modificam dados existentes (como atualização, exclusão, etc.).
- **onNewRecord**: Se deve ter efeito ao criar novos registros, válido apenas para o tipo `'new-data'`.

Após o registro, esta operação aparecerá na interface de configuração de permissões, onde os administradores podem configurar as permissões da operação na página de gerenciamento de funções.