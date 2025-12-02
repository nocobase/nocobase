:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Integração de Single Sign-On (SSO)

O NocoBase oferece soluções completas de Single Sign-On (SSO), também conhecido como Login Único, que suportam diversos protocolos de autenticação populares para uma integração perfeita com os sistemas de identidade corporativos existentes.

## Visão Geral

O Single Sign-On permite que os usuários acessem múltiplos sistemas relacionados, mas independentes, usando um único conjunto de credenciais. Você se autentica apenas uma vez e obtém acesso a todos os aplicativos autorizados, sem precisar digitar seu nome de usuário e senha repetidamente. Isso não só melhora a experiência do usuário, mas também aumenta a segurança do sistema e a eficiência da gestão.

## Protocolos de Autenticação Suportados

O NocoBase suporta os seguintes protocolos e métodos de autenticação através de **plugins**:

### Protocolos SSO Empresariais

- **[SAML 2.0](/auth-verification/auth-saml/)**: Um padrão aberto baseado em XML, amplamente utilizado para autenticação de identidade em nível empresarial. Ideal para cenários que exigem integração com Provedores de Identidade (IdP) corporativos.

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/)**: Uma camada de autenticação moderna construída sobre o OAuth 2.0, que oferece mecanismos de autenticação e autorização. Suporta integração com os principais provedores de identidade (como Google, Azure AD, etc.).

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/)**: Protocolo SSO desenvolvido pela Universidade de Yale, amplamente adotado em instituições de ensino superior e educacionais.

- **[LDAP](/auth-verification/auth-ldap/)**: Protocolo de Acesso a Diretório Leve, utilizado para acessar e manter serviços de informações de diretório distribuídos. Adequado para cenários que exigem integração com Active Directory ou outros servidores LDAP.

### Autenticação de Plataformas de Terceiros

- **[WeCom (WeChat Work)](/auth-verification/auth-wecom/)**: Suporta login por QR code do WeCom e autenticação contínua (seamless) dentro do aplicativo.

- **[DingTalk](/auth-verification/auth-dingtalk/)**: Suporta login por QR code do DingTalk e autenticação contínua (seamless) dentro do aplicativo.

### Outros Métodos de Autenticação

- **[Verificação por SMS](/auth-verification/auth-sms/)**: Autenticação por código de verificação baseada em SMS de celular.

- **[Nome de Usuário/Senha](/auth-verification/auth/)**: O método de autenticação básico integrado ao NocoBase.

## Etapas de Integração

### 1. Instalar o Plugin de Autenticação

Com base nas suas necessidades, localize e instale o **plugin** de autenticação apropriado no gerenciador de **plugins**. A maioria dos **plugins** de autenticação SSO exige compra ou assinatura separada.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Por exemplo, instale o **plugin** de autenticação SAML 2.0:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

Ou instale o **plugin** de autenticação OIDC:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Configurar o Método de Autenticação

1. Navegue até a página **Configurações do Sistema > Autenticação de Usuário**

![](https://static-docs.nocobase.com/202411130004459.png)

2. Clique em **Adicionar Método de Autenticação**
3. Selecione o tipo de autenticação instalado (por exemplo, SAML)

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

Ou selecione OIDC:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. Configure os parâmetros necessários conforme as instruções.

### 3. Configurar o Provedor de Identidade

Cada protocolo de autenticação exige uma configuração específica do Provedor de Identidade:

- **SAML**: Configure metadados do IdP, certificados, etc.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: Configure Client ID, Client Secret, endpoint de descoberta, etc.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: Configure o endereço do servidor CAS
- **LDAP**: Configure o endereço do servidor LDAP, Bind DN, etc.
- **WeCom/DingTalk**: Configure credenciais do aplicativo, Corp ID, etc.

### 4. Testar a Autenticação

Após a configuração, é recomendável realizar um teste de login:

1. Saia da sessão atual
2. Na página de login, selecione o método SSO configurado

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. Conclua o fluxo de autenticação do Provedor de Identidade
4. Verifique se você consegue fazer login no NocoBase com sucesso.

## Mapeamento de Usuários e Atribuição de Funções

Após a autenticação SSO bem-sucedida, o NocoBase gerencia automaticamente as contas de usuário:

- **Primeiro Login**: Cria automaticamente uma nova conta de usuário e sincroniza informações básicas (como apelido, e-mail, etc.) do Provedor de Identidade.
- **Logins Subsequentes**: Utiliza a conta existente; você pode optar por sincronizar ou não as informações atualizadas do usuário.
- **Atribuição de Funções**: É possível configurar funções padrão ou atribuir funções automaticamente com base nos atributos de função das informações do usuário do Provedor de Identidade.

## Recomendações de Segurança

1. **Use HTTPS**: Certifique-se de que o NocoBase esteja implantado em um ambiente HTTPS para proteger a transmissão de dados de autenticação.
2. **Atualizações Regulares de Certificados**: Atualize e rotacione prontamente as credenciais de segurança, como certificados SAML.
3. **Configure a Lista Branca de URLs de Retorno (Callback)**: Configure corretamente as URLs de retorno (callback) do NocoBase no Provedor de Identidade.
4. **Princípio do Menor Privilégio**: Atribua funções e permissões apropriadas aos usuários SSO.
5. **Ative o Registro de Auditoria**: Registre e monitore as atividades de login SSO.

## Solução de Problemas

### Falha no Login SSO?

1. Verifique se a configuração do Provedor de Identidade está correta.
2. Certifique-se de que as URLs de retorno (callback) estejam configuradas corretamente.
3. Verifique os logs do NocoBase para obter mensagens de erro detalhadas.
4. Confirme se os certificados e as chaves são válidos.

### Informações do Usuário Não Estão Sincronizando?

1. Verifique os atributos de usuário retornados pelo Provedor de Identidade.
2. Verifique se a configuração de mapeamento de campos está correta.
3. Confirme se a opção de sincronização de informações do usuário está ativada.

### Como Suportar Múltiplos Métodos de Autenticação?

O NocoBase suporta a configuração de múltiplos métodos de autenticação simultaneamente. Os usuários podem selecionar o método preferido na página de login.

## Recursos Relacionados

- [Documentação de Autenticação](/auth-verification/auth/)
- [Autenticação por Chaves de API](/integration/api-keys/)
- [Gerenciamento de Usuários e Permissões](/plugins/@nocobase/plugin-users/)