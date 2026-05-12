:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Guia de Segurança do NocoBase

O NocoBase foca na segurança de dados e aplicações, desde o design funcional até a implementação do sistema. A plataforma possui diversas funções de segurança integradas, como autenticação de usuário, controle de acesso e criptografia de dados, além de permitir a configuração flexível de políticas de segurança conforme suas necessidades. Seja para proteger dados de usuários, gerenciar permissões de acesso ou isolar ambientes de desenvolvimento e produção, o NocoBase oferece ferramentas e soluções práticas. Este guia tem como objetivo fornecer orientações para o uso seguro do NocoBase, ajudando você a proteger seus dados, aplicações e ambiente, garantindo o uso eficiente das funções do sistema com segurança.

## Autenticação de Usuário

A autenticação de usuário é usada para identificar a identidade do usuário, impedir que usuários não autorizados acessem o sistema e garantir que as identidades dos usuários não sejam usadas indevidamente.

### Chave do Token

Por padrão, o NocoBase usa JWT (JSON Web Token) para autenticação das APIs do lado do servidor. Você pode definir a chave do Token através da variável de ambiente do sistema `APP_KEY`. Gerencie adequadamente a chave do Token da sua aplicação para evitar vazamentos externos. É importante notar que, se a `APP_KEY` for modificada, os Tokens antigos também se tornarão inválidos.

### Política de Token

O NocoBase permite configurar as seguintes políticas de segurança para os Tokens de usuário:

| Item de Configuração        | Descrição
 
## Segurança de Dados

### Armazenamento de arquivos

Se precisar armazenar arquivos sensíveis, é recomendável usar um serviço de armazenamento em nuvem compatível com o protocolo S3 e utilizar o plugin comercial File storage: S3 (Pro) para permitir leitura e gravação privadas dos arquivos.

Para armazenamento local ou outro armazenamento público acessível diretamente por URLs da aplicação no mesmo domínio de origem, também é necessário prestar atenção extra aos riscos trazidos por arquivos com conteúdo ativo. Arquivos como `html`, `xhtml` e `svg` podem ser interpretados e executados diretamente pelo navegador. Se um invasor conseguir enviar esse tipo de arquivo e induzir um usuário a abri-lo, poderá usar o domínio confiável da sua aplicação para hospedar uma página ou script malicioso.

Em geral, recomendamos que os administradores:

- Priorizem armazenamento privado, URLs assinadas ou um domínio separado para arquivos, para evitar que arquivos enviados por usuários sejam servidos diretamente a partir da mesma origem da aplicação principal.
- Apliquem uma allowlist estrita de tipos MIME para upload e permitam apenas os tipos de arquivo realmente necessários para o negócio.
- Sejam cautelosos ao permitir tipos de conteúdo ativo como `text/html`, `application/xhtml+xml` e `image/svg+xml`. Mesmo que o sistema tente retornar esses arquivos como download, isso não deve ser tratado como substituto completo para restrições de upload e isolamento de origem.
- Configurem de forma consistente proxies reversos, CDNs, armazenamento de objetos e qualquer outra camada de distribuição de arquivos estáticos, evitando que arquivos perigosos sejam retornados inline contornando as proteções da aplicação.
- Não usem armazenamento local/público para hospedar conteúdo Web não confiável. Se isso for realmente necessário, usem um domínio isolado e avaliem separadamente CSP, política de download e controle de acesso.

Se um administrador permitir explicitamente o upload de tipos de arquivo perigosos, ele deverá avaliar por conta própria os riscos resultantes de phishing, execução de scripts na mesma origem e vazamento de informações sensíveis, além de garantir que Web Server, gateway, CDN e serviços de armazenamento apliquem restrições consistentes em toda a cadeia de implantação.
