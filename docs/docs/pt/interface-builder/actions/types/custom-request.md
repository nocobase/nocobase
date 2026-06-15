# Custom Request

## Introdução

Quando um fluxo precisa chamar uma API externa ou um serviço de terceiros, é possível usar a Custom Request para disparar uma requisição HTTP personalizada. Cenários comuns incluem:

* Chamadas a APIs de sistemas externos (CRM, serviços de IA etc.)
* Obtenção de dados remotos para uso em passos posteriores do fluxo
* Envio de dados para sistemas de terceiros (Webhook, notificações etc.)
* Disparo de fluxos automatizados em serviços internos ou externos

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_07_PM.png)


## Configuração da Action

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_09_PM.png)

Em Configurações do botão -> Custom Request, é possível configurar:

* HTTP method: o método HTTP, por exemplo GET, POST, PUT, DELETE etc.
* URL: o endereço de destino da requisição. Aceita uma URL completa ou pode ser composta dinamicamente com variáveis.
* Headers: cabeçalhos da requisição, usados para passar informações de autenticação ou opções de API, como Authorization, Content-Type etc.
* Parameters: parâmetros de query (Query Parameters) na URL, usados em geral para requisições GET.
* Body: corpo da requisição, usado em geral para POST, PUT etc. Pode conter JSON, dados de formulário etc.
* Timeout config: configuração de timeout, define o tempo máximo de espera para evitar que o fluxo fique bloqueado por muito tempo.
* Response type: tipo de dado retornado pela requisição.
* JSON: a API retorna JSON; o resultado é injetado no contexto do fluxo e pode ser lido nos próximos passos via ctx.steps.
* Stream: a API retorna um fluxo (Stream); ao concluir com sucesso, dispara automaticamente o download do arquivo.
* Access control: controle de acesso, restringe quais papéis podem disparar este passo de requisição, garantindo a segurança da chamada.

## Outras configurações da Action

Além das configurações de requisição, o botão de Custom Request também aceita estas configurações comuns:

- [Editar botão](/interface-builder/actions/action-settings/edit-button): configura título, estilo, ícone do botão etc.;
- [Regras de linkagem da Action](/interface-builder/actions/action-settings/linkage-rule): controla dinamicamente exibição, desativação e outros estados do botão com base em condições;
- [Confirmação dupla](/interface-builder/actions/action-settings/double-check): exibe um diálogo de confirmação antes de enviar a requisição.
