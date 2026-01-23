:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Integração

## Visão Geral

O NocoBase oferece recursos de integração abrangentes, permitindo uma conexão perfeita com sistemas externos, serviços de terceiros e diversas **fontes de dados**. Através de métodos de integração flexíveis, você pode estender a funcionalidade do NocoBase para atender a diversas necessidades de negócios.

## Métodos de Integração

### Integração de API

O NocoBase oferece recursos de API poderosos para integração com aplicativos e serviços externos:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[Chaves de API](/integration/api-keys/)**: Use chaves de API para autenticação segura e acesso programático aos recursos do NocoBase.
- **[Documentação da API](/integration/api-doc/)**: Documentação da API integrada para explorar e testar endpoints.

### Single Sign-On (SSO)

Integre com sistemas de identidade corporativos para autenticação unificada:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[Integração SSO](/integration/sso/)**: Suporte para autenticação SAML, OIDC, CAS, LDAP e plataformas de terceiros.
- Gerenciamento centralizado de usuários e controle de acesso.
- Experiência de autenticação perfeita entre sistemas.

### Integração de Fluxo de Trabalho

Conecte os **fluxos de trabalho** do NocoBase a sistemas externos:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Webhook de Fluxo de Trabalho](/integration/workflow-webhook/)**: Receba eventos de sistemas externos para acionar **fluxos de trabalho**.
- **[Requisição HTTP de Fluxo de Trabalho](/integration/workflow-http-request/)**: Envie requisições HTTP para APIs externas a partir de **fluxos de trabalho**.
- Automatize processos de negócios entre plataformas.

### Fontes de Dados Externas

Conecte-se a bancos de dados e sistemas de dados externos:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Bancos de Dados Externos](/data-sources/)**: Conecte-se diretamente a bancos de dados MySQL, PostgreSQL, MariaDB, MSSQL, Oracle e KingbaseES.
- Reconheça estruturas de tabelas de bancos de dados externos e realize operações CRUD (Criar, Ler, Atualizar, Excluir) diretamente nos dados externos dentro do NocoBase.
- Interface unificada de gerenciamento de dados.

### Conteúdo Incorporado

Incorpore conteúdo externo no NocoBase:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Bloco Iframe](/integration/block-iframe/)**: Incorpore páginas da web e aplicativos externos.
- **Blocos JS**: Execute código JavaScript personalizado para integrações avançadas.

## Cenários Comuns de Integração

### Integração de Sistemas Corporativos

- Conecte o NocoBase a sistemas ERP, CRM ou outros sistemas corporativos.
- Sincronize dados bidirecionalmente.
- Automatize **fluxos de trabalho** entre sistemas.

### Integração de Serviços de Terceiros

- Consulte o status de pagamentos de gateways de pagamento, integre serviços de mensagens ou plataformas de nuvem.
- Aproveite APIs externas para estender a funcionalidade.
- Crie integrações personalizadas usando webhooks e requisições HTTP.

### Integração de Dados

- Conecte-se a múltiplas **fontes de dados**.
- Agregue dados de diferentes sistemas.
- Crie painéis e relatórios unificados.

## Considerações de Segurança

Ao integrar o NocoBase com sistemas externos, considere as seguintes melhores práticas de segurança:

1.  **Use HTTPS**: Sempre utilize conexões criptografadas para a transmissão de dados.
2.  **Proteja as Chaves de API**: Armazene as chaves de API de forma segura e as rotacione regularmente.
3.  **Princípio do Menor Privilégio**: Conceda apenas as permissões necessárias para as integrações.
4.  **Registro de Auditoria**: Monitore e registre as atividades de integração.
5.  **Validação de Dados**: Valide todos os dados provenientes de fontes externas.