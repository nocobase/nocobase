:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Integração de Requisições HTTP em Fluxos de Trabalho

Através do nó de Requisição HTTP, os **fluxos de trabalho** do NocoBase podem enviar requisições proativamente para qualquer serviço HTTP, facilitando a troca de dados e a integração de negócios com sistemas externos.

## Visão Geral

O nó de Requisição HTTP é um componente central de integração em **fluxos de trabalho**, permitindo que você chame APIs de terceiros, interfaces de serviços internos ou outros serviços web durante a execução do **fluxo de trabalho** para recuperar dados ou acionar operações externas.

## Casos de Uso Típicos

### Recuperação de Dados

- **Consultas a Dados de Terceiros**: Obtenha dados em tempo real de APIs de clima, APIs de taxa de câmbio, etc.
- **Resolução de Endereços**: Chame APIs de serviços de mapeamento para análise de endereços e geocodificação.
- **Sincronização de Dados Corporativos**: Recupere dados de clientes e pedidos de sistemas CRM e ERP.

### Gatilhos de Negócio

- **Envio de Mensagens**: Chame serviços de SMS, e-mail, WeCom, etc., para enviar notificações.
- **Requisições de Pagamento**: Inicie pagamentos, reembolsos e outras operações com gateways de pagamento.
- **Processamento de Pedidos**: Envie notas de remessa e consulte o status da logística com sistemas de transporte.

### Integração de Sistemas

- **Chamadas de Microsserviços**: Chame APIs de outros serviços em arquiteturas de microsserviços.
- **Relatório de Dados**: Relate dados de negócios para plataformas de análise e sistemas de monitoramento.
- **Serviços de Terceiros**: Integre serviços de IA, reconhecimento OCR, síntese de fala, etc.

### Automação

- **Tarefas Agendadas**: Chame APIs externas periodicamente para sincronizar dados.
- **Resposta a Eventos**: Chame APIs externas automaticamente quando os dados mudarem para notificar sistemas relacionados.
- **Fluxos de Trabalho de Aprovação**: Envie requisições de aprovação por meio de APIs de sistemas de aprovação.

## Recursos

### Suporte HTTP Completo

- Suporta todos os métodos HTTP: GET, POST, PUT, PATCH, DELETE.
- Suporta cabeçalhos de requisição (Headers) personalizados.
- Suporta múltiplos formatos de dados: JSON, dados de formulário, XML, etc.
- Suporta vários tipos de parâmetros: parâmetros de URL, parâmetros de caminho, corpo da requisição, etc.

### Processamento Flexível de Dados

- **Referências de Variáveis**: Construa requisições dinamicamente usando variáveis do **fluxo de trabalho**.
- **Análise de Resposta**: Analise automaticamente respostas JSON e extraia os dados necessários.
- **Transformação de Dados**: Transforme os formatos dos dados de requisição e resposta.
- **Tratamento de Erros**: Configure estratégias de repetição, configurações de tempo limite e lógica de tratamento de erros.

### Autenticação de Segurança

- **Basic Auth**: Autenticação básica HTTP.
- **Bearer Token**: Autenticação por token.
- **API Key**: Autenticação por chave de API personalizada.
- **Cabeçalhos Personalizados**: Suporte para qualquer método de autenticação.

## Passos para Uso

### 1. Verifique se o **plugin** está habilitado

O nó de Requisição HTTP é um recurso integrado do **plugin** de **fluxo de trabalho**. Certifique-se de que o **[plugin](/plugins/@nocobase/plugin-workflow/)** de **Fluxo de Trabalho** esteja habilitado.

### 2. Adicione um nó de Requisição HTTP ao **fluxo de trabalho**

1. Crie ou edite um **fluxo de trabalho**.
2. Adicione um nó de **Requisição HTTP** na posição desejada.

![Requisição HTTP - Adicionar Nó](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. Configure os parâmetros da requisição.

### 3. Configure os Parâmetros da Requisição

![Nó de Requisição HTTP - Configuração](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Configuração Básica

- **URL da Requisição**: Endereço da API de destino, suporta o uso de variáveis.
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **Método da Requisição**: Selecione GET, POST, PUT, DELETE, etc.

- **Cabeçalhos da Requisição**: Configure os Cabeçalhos HTTP.
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **Parâmetros da Requisição**:
  - **Parâmetros de Query**: Parâmetros de consulta da URL.
  - **Parâmetros de Corpo**: Dados do corpo da requisição (POST/PUT).

#### Configuração Avançada

- **Tempo Limite**: Defina o tempo limite da requisição (padrão: 30 segundos).
- **Repetir em Caso de Falha**: Configure o número de tentativas e o intervalo de repetição.
- **Ignorar Falha**: Continue o **fluxo de trabalho** mesmo que a requisição falhe.
- **Configurações de Proxy**: Configure o proxy HTTP (se necessário).

### 4. Use os Dados da Resposta

Após a execução do nó de Requisição HTTP, os dados da resposta podem ser usados nos nós subsequentes:

- `{{$node.data.status}}`: Código de status HTTP.
- `{{$node.data.headers}}`: Cabeçalhos da resposta.
- `{{$node.data.data}}`: Dados do corpo da resposta.
- `{{$node.data.error}}`: Mensagem de erro (se a requisição falhar).

![Nó de Requisição HTTP - Uso da Resposta](https://static-docs.nocobase.com/20240529110610.png)

## Cenários de Exemplo

### Exemplo 1: Obter Informações Climáticas

```javascript
// Configuração
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Usar Resposta
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### Exemplo 2: Enviar Mensagem WeCom

```javascript
// Configuração
URL: https://qyapi.weixin.qq.com/cgi-bin/message/send
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "touser": "{{$context.userId}}",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "Pedido {{$context.orderId}} foi enviado"
  }
}
```

### Exemplo 3: Consultar Status de Pagamento

```javascript
// Configuração
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// Lógica Condicional
Se {{$node.data.data.status}} for igual a "paid"
  - Atualizar status do pedido para "Pago"
  - Enviar notificação de sucesso de pagamento
Senão Se {{$node.data.data.status}} for igual a "pending"
  - Manter status do pedido como "Aguardando Pagamento"
Senão
  - Registrar falha de pagamento
  - Notificar administrador para tratar a exceção
```

### Exemplo 4: Sincronizar Dados com o CRM

```javascript
// Configuração
URL: https://api.crm.com/v1/customers
Method: POST
Headers:
  X-API-Key: {{$context.crmApiKey}}
  Content-Type: application/json
Body:
{
  "name": "{{$context.customerName}}",
  "email": "{{$context.email}}",
  "phone": "{{$context.phone}}",
  "source": "NocoBase",
  "created_at": "{{$context.createdAt}}"
}
```

## Configuração de Autenticação

### Autenticação Básica

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Token de Portador (Bearer Token)

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### Chave de API (API Key)

```javascript
// No Cabeçalho
Headers:
  X-API-Key: your-api-key

// Ou na Query
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

Primeiro, obtenha o `access_token` e depois use:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Tratamento de Erros e Depuração

### Erros Comuns

1. **Tempo Limite de Conexão**: Verifique a conexão de rede, aumente o tempo limite.
2. **401 Não Autorizado**: Verifique se as credenciais de autenticação estão corretas.
3. **404 Não Encontrado**: Verifique se a URL está correta.
4. **500 Erro Interno do Servidor**: Verifique o status do serviço do provedor da API.

### Dicas de Depuração

1. **Use Nós de Log**: Adicione nós de log antes e depois das requisições HTTP para registrar os dados da requisição e da resposta.

2. **Verifique os Logs de Execução**: Os logs de execução do **fluxo de trabalho** contêm informações detalhadas da requisição e da resposta.

3. **Ferramentas de Teste**: Teste a API primeiro usando ferramentas como Postman, cURL, etc.

4. **Tratamento de Erros**: Adicione lógica condicional para tratar diferentes status de resposta.

```javascript
Se {{$node.data.status}} >= 200 e {{$node.data.status}} < 300
  - Lógica de sucesso
Senão
  - Lógica de falha
  - Registrar erro: {{$node.data.error}}
```

## Otimização de Desempenho

### 1. Use Processamento Assíncrono

Para requisições que não exigem resultados imediatos, considere usar **fluxos de trabalho** assíncronos.

### 2. Configure Tempos Limite Razoáveis

Defina tempos limite com base nos tempos de resposta reais da API para evitar esperas excessivas.

### 3. Implemente Estratégias de Cache

Para dados que não mudam com frequência (configurações, dicionários), considere armazenar em cache as respostas.

### 4. Processamento em Lote

Se precisar fazer várias chamadas para a mesma API, considere usar os endpoints de lote da API (se suportado).

### 5. Repetição em Caso de Erro

Configure estratégias de repetição razoáveis, mas evite repetições excessivas que possam causar limitação de taxa da API.

## Melhores Práticas de Segurança

### 1. Proteja Informações Sensíveis

- Não exponha informações sensíveis em URLs.
- Use HTTPS para transmissão criptografada.
- Armazene chaves de API e dados sensíveis em variáveis de ambiente ou gerenciamento de configuração.

### 2. Valide os Dados da Resposta

```javascript
// Validar status da resposta
if (![200, 201].includes($node.data.status)) {
  throw new Error('A requisição da API falhou');
}

// Validar formato dos dados
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Dados de resposta inválidos');
}
```

### 3. Limitação de Taxa de Requisições

Respeite os limites de taxa das APIs de terceiros para evitar ser bloqueado.

### 4. Anonimização de Logs

Ao registrar logs, tenha cuidado para anonimizar informações sensíveis (senhas, chaves, etc.).

## Comparação com Webhook

| Característica | Nó de Requisição HTTP | Gatilho de Webhook |
|------|-------------|---------------|
| Direção | NocoBase chama externamente | Externo chama NocoBase |
| Momento | Durante a execução do **fluxo de trabalho** | Quando um evento externo ocorre |
| Propósito | Obter dados, acionar operações externas | Receber notificações, eventos externos |
| Cenários Típicos | Chamar API de pagamento, consultar clima | Retornos de chamada de pagamento, notificações de mensagem |

Esses dois recursos se complementam para construir uma solução completa de integração de sistemas.

## Recursos Relacionados

- [Documentação do **Plugin** de **Fluxo de Trabalho**](/plugins/@nocobase/plugin-workflow/)
- [**Fluxo de Trabalho**: Nó de Requisição HTTP](/workflow/nodes/request)
- [**Fluxo de Trabalho**: Gatilho de Webhook](/integration/workflow-webhook/)
- [Autenticação por Chaves de API](/integration/api-keys/)
- [**Plugin** de Documentação da API](/plugins/@nocobase/plugin-api-doc/)