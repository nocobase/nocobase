:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Google Workspace

## Configurar o Google como IdP

[Console de Administração do Google](https://admin.google.com/) - Aplicativos - Aplicativos web e para dispositivos móveis

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

Após configurar o aplicativo, copie a **SSO URL**, o **ID da Entidade** e o **Certificado**.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## Adicionar um novo Autenticador no NocoBase

Configurações do Plugin - Autenticação de Usuário - Adicionar - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Preencha as informações copiadas nos campos correspondentes:

- SSO URL: SSO URL
- Certificado Público: Certificado
- Emissor do IdP: ID da Entidade
- http: Marque esta opção se estiver testando localmente com http

Em seguida, copie o SP Issuer/EntityID e a ACS URL da seção Uso.

## Preencher as Informações do SP no Google

Volte ao Console do Google, na página **Detalhes do Provedor de Serviços**, insira a ACS URL e o ID da Entidade copiados anteriormente e marque a opção **Resposta Assinada**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

Na seção **Mapeamento de Atributos**, adicione mapeamentos para os atributos correspondentes.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)