:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Integração de Webhook do Fluxo de Trabalho

Através de gatilhos Webhook, o NocoBase pode receber chamadas HTTP de sistemas de terceiros e acionar automaticamente **fluxos de trabalho**, permitindo uma integração perfeita com sistemas externos.

## Visão Geral

Webhooks são um mecanismo de "API reversa" que permite que sistemas externos enviem dados proativamente ao NocoBase quando eventos específicos ocorrem. Em comparação com o polling ativo, Webhooks oferecem uma abordagem de integração mais em tempo real e eficiente.

## Casos de Uso Típicos

### Envio de Dados de Formulário

Sistemas de pesquisa externos, formulários de inscrição e formulários de feedback de clientes enviam dados para o NocoBase via Webhook após o envio pelo usuário, criando automaticamente registros e acionando processos de acompanhamento (como envio de e-mails de confirmação, atribuição de tarefas, etc.).

### Notificações de Mensagens

Eventos de plataformas de mensagens de terceiros (como WeCom, DingTalk, Slack), como novas mensagens, menções ou aprovações concluídas, podem acionar processos automatizados no NocoBase através de Webhooks.

### Sincronização de Dados

Quando dados são alterados em sistemas externos (como CRM, ERP), Webhooks enviam atualizações para o NocoBase em tempo real para manter a sincronização dos dados.

### Integração de Serviços de Terceiros

- **GitHub**: Eventos de push de código, criação de PRs acionam **fluxos de trabalho** de automação
- **GitLab**: Notificações de status de pipeline de CI/CD
- **Envios de Formulários**: Sistemas de formulários externos enviam dados para o NocoBase
- **Dispositivos IoT**: Alterações de status de dispositivos, relatórios de dados de sensores

## Recursos

### Mecanismo de Gatilho Flexível

- Suporta métodos HTTP GET, POST, PUT, DELETE
- Analisa automaticamente JSON, dados de formulário e outros formatos comuns
- Validação de requisição configurável para garantir fontes confiáveis

### Capacidades de Processamento de Dados

- Os dados recebidos podem ser usados como variáveis em **fluxos de trabalho**
- Suporta lógica complexa de transformação e processamento de dados
- Pode ser combinado com outros nós de **fluxo de trabalho** para implementar lógica de negócios complexa

### Garantia de Segurança

- Suporta verificação de assinatura para prevenir requisições falsificadas
- Lista de permissões de IP configurável
- Transmissão criptografada via HTTPS

## Passos de Uso

### 1. Instalar o **plugin**

Localize e instale o **[Fluxo de Trabalho: Gatilho Webhook](/plugins/@nocobase/plugin-workflow-webhook/)** **plugin** no gerenciador de **plugins**.

> Observação: Este é um **plugin** comercial que requer compra ou assinatura separada.

### 2. Criar um **Fluxo de Trabalho** Webhook

1. Acesse a página de **Gerenciamento de Fluxos de Trabalho**
2. Clique em **Criar Fluxo de Trabalho**
3. Selecione **Gatilho Webhook** como o tipo de gatilho

![Criar Fluxo de Trabalho Webhook](https://static-docs.nocobase.com/20241210105049.png)

4. Configure os parâmetros do Webhook

![Configuração do Gatilho Webhook](https://static-docs.nocobase.com/20241210105441.png)
   - **Caminho da Requisição**: Caminho da URL do Webhook personalizado
   - **Método da Requisição**: Selecione os métodos HTTP permitidos (GET/POST/PUT/DELETE)
   - **Síncrono/Assíncrono**: Escolha se deseja aguardar a conclusão do **fluxo de trabalho** antes de retornar os resultados
   - **Validação**: Configure a verificação de assinatura ou outros mecanismos de segurança

### 3. Configurar os Nós do **Fluxo de Trabalho**

Adicione nós de **fluxo de trabalho** com base nos requisitos de negócios, como:

- **Operações de Coleção**: Criar, atualizar, excluir registros
- **Lógica Condicional**: Ramificar com base nos dados recebidos
- **Requisição HTTP**: Chamar outras APIs
- **Notificações**: Enviar e-mails, SMS, etc.
- **Código Personalizado**: Executar código JavaScript

### 4. Obter a URL do Webhook

Após a criação do **fluxo de trabalho**, o sistema gera uma URL de Webhook única, geralmente no formato:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Configurar em um Sistema de Terceiros

Configure a URL do Webhook gerada no sistema de terceiros:

- Defina o endereço de callback para envio de dados em sistemas de formulário
- Configure o Webhook no GitHub/GitLab
- Configure o endereço de push de eventos no WeCom/DingTalk

### 6. Testar o Webhook

Teste o Webhook usando ferramentas como Postman ou cURL:

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Acessando Dados da Requisição

Em **fluxos de trabalho**, acesse os dados do Webhook através de variáveis:

- `{{$context.data}}`: Dados do corpo da requisição
- `{{$context.headers}}`: Cabeçalhos da requisição
- `{{$context.query}}`: Parâmetros de consulta da URL
- `{{$context.params}}`: Parâmetros de caminho

![Análise de Parâmetros da Requisição](https://static-docs.nocobase.com/20241210111155.png)

![Análise do Corpo da Requisição](https://static-docs.nocobase.com/20241210112529.png)

## Configuração de Resposta

![Configurações de Resposta](https://static-docs.nocobase.com/20241210114312.png)

### Modo Síncrono

Retorna os resultados após a conclusão da execução do **fluxo de trabalho**, configurável:

- **Código de Status da Resposta**: 200, 201, etc.
- **Dados da Resposta**: Resposta JSON personalizada
- **Cabeçalhos da Resposta**: Cabeçalhos HTTP personalizados

### Modo Assíncrono

Retorna confirmação imediata, o **fluxo de trabalho** é executado em segundo plano. Adequado para:

- **Fluxos de trabalho** de longa duração
- Cenários que não exigem resultados de execução
- Cenários de alta concorrência

## Melhores Práticas de Segurança

### 1. Habilitar Verificação de Assinatura

A maioria dos serviços de terceiros suporta mecanismos de assinatura:

```javascript
// Exemplo: Verificar assinatura do Webhook do GitHub
const crypto = require('crypto');
const signature = context.headers['x-hub-signature-256'];
const payload = JSON.stringify(context.data);
const secret = 'your-webhook-secret';
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. Usar HTTPS

Garanta que o NocoBase esteja implantado em um ambiente HTTPS para proteger a transmissão de dados.

### 3. Restringir Fontes de Requisição

Configure uma lista de permissões de IP para permitir apenas requisições de fontes confiáveis.

### 4. Validação de Dados

Adicione lógica de validação de dados em **fluxos de trabalho** para garantir formato correto e conteúdo válido.

### 5. Auditoria de Logs

Registre todas as requisições Webhook para rastreamento e solução de problemas.

## Solução de Problemas

### Webhook Não Está Acionando?

1. Verifique se a URL do Webhook está correta
2. Confirme se o status do **fluxo de trabalho** é "Habilitado"
3. Verifique os logs de envio do sistema de terceiros
4. Revise a configuração do firewall e da rede

### Como Depurar Webhooks?

1. Verifique os registros de execução do **fluxo de trabalho** para obter informações detalhadas sobre as requisições e resultados
2. Use ferramentas de teste de Webhook (como Webhook.site) para verificar as requisições
3. Revise os dados chave e mensagens de erro nos registros de execução

### Como Lidar com Retentativas?

Alguns serviços de terceiros tentam reenviar se não receberem uma resposta bem-sucedida:

- Garanta que o **fluxo de trabalho** seja idempotente
- Use identificadores únicos para deduplicação
- Registre os IDs das requisições processadas

### Dicas de Otimização de Desempenho

- Use o modo assíncrono para operações demoradas
- Adicione lógica condicional para filtrar requisições desnecessárias
- Considere usar filas de mensagens para cenários de alta concorrência

## Cenários de Exemplo

### Processamento de Envio de Formulário Externo

```javascript
// 1. Verificar fonte de dados
// 2. Analisar dados do formulário
const formData = context.data;

// 3. Criar registro de cliente
// 4. Atribuir ao responsável
// 5. Enviar e-mail de confirmação ao remetente
if (formData.email) {
  // Enviar notificação por e-mail
}
```

### Notificação de Push de Código do GitHub

```javascript
// 1. Analisar dados do push
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Se for o branch principal
if (branch === 'main') {
  // 3. Acionar processo de implantação
  // 4. Notificar membros da equipe
}
```

![Exemplo de Fluxo de Trabalho Webhook](https://static-docs.nocobase.com/20241210120655.png)

## Recursos Relacionados

- [Documentação do **Plugin** de **Fluxo de Trabalho**](/plugins/@nocobase/plugin-workflow/)
- [**Fluxo de Trabalho**: Gatilho Webhook](/workflow/triggers/webhook)
- [**Fluxo de Trabalho**: Nó de Requisição HTTP](/integration/workflow-http-request/)
- [Autenticação por Chaves de API](/integration/api-keys/)