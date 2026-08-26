# A intenção do design de `nb proxy`

Se falarmos apenas do processo central, basta lembrar estes 3 comandos:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Na maioria dos cenários, o que você usa `nb proxy` para fazer é essencialmente estas três etapas:

1. Primeiro use `use` para selecionar o modo de execução do provedor atual
2. Em seguida, use `generate` para gerar a configuração de entrada de acordo com o ambiente e o nome de domínio
3. Finalmente use `reload` para que a configuração tenha efeito

Se você estiver usando o Caddy, basta substituir `nginx` no comando por `caddy`. Se o Nginx estiver instalado diretamente na máquina, basta substituir `docker` por `local`.

Essa também é a experiência que essa camada do `nb proxy` mais deseja proporcionar: você não precisa entrar primeiro nos detalhes de configuração do Nginx ou Caddy, basta conectar a entrada de acordo com o processo fixo.

## Por que é suficiente lembrar desses 3 itens primeiro?

Porque o problema resolvido por `nb proxy` é na verdade muito convergente: **Forneça ao aplicativo uma entrada de acesso externo estável. **

Se você já viu [Visão geral da implantação do ambiente de produção](../production/index.md), você pode lembrá-lo separadamente de `nb app autostart` assim:

- `nb app autostart` é responsável por "como retomar a execução da aplicação após a máquina ser reiniciada"
- `nb proxy` é responsável por "como o aplicativo pode fornecer acesso externo estável através de Nginx ou Caddy"

Portanto, no processo de implantação mais comum, `nb proxy` não requer muita atenção. Na maioria das vezes é:

- Selecione o modo de operação
- Gerar configuração
- A recarga entra em vigor

Suficiente.

## O que essas três etapas estão fazendo?

### `use`

`use` resolve o problema de "como gerenciar o agente atualmente".

por exemplo:

- `nb proxy nginx use docker`
- `nb proxy nginx use local`

Você pode pensar nisso como selecionar primeiro o driver padrão do provedor atual. Os seguintes comandos `start`, `reload` e `status` funcionarão desta forma.

### `generate`

`generate` resolve o problema de "renderizar a configuração da entrada de acordo com o ambiente atual".

por exemplo:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Esta etapa combinará as informações em env com os parâmetros exigidos pela camada de entrada para gerar uma configuração de proxy utilizável. A entrada mais crítica aqui é geralmente:

- `--env`: Qual ambiente gerenciado pela CLI expor
- `--host`: Qual nome de domínio vincular

Em outras palavras, `generate` gerencia produtos de configuração, não o status do processo.

### `reload`

`reload` resolve o problema de "tornar a configuração recém-gerada verdadeiramente eficaz".

```bash
nb proxy nginx reload
```

Essa separação tem um benefício direto: a geração de configuração e as ações do processo não são misturadas. Ao alterar o nome de domínio, porta ou caminho público, gere-o primeiro e depois decida fazer com que entre em vigor. Todo o processo ficará mais claro.

## Por que deveria ser projetado como `use → generate → reload`

Porque estas três etapas correspondem apenas às três ações mais estáveis ​​da camada de entrada:

- Decida primeiro como executar o agente
- Em seguida, decida qual entrada gerar para qual ambiente
-Finalmente deixe a configuração entrar em vigor

Se você colocar todas essas etapas em um comando de caixa preta, parecerá que há menos comandos na superfície. No entanto, quando ocorre um problema, é difícil determinar se o driver foi selecionado incorretamente, se a configuração não foi gerada corretamente ou se o agente não foi recarregado.

Agora depois de desmontar assim, o caminho da investigação ficará mais direto:

- `use` Se estiver errado, basta cortar o driver
- `generate` está incorreto, gere novamente a configuração.
- A configuração está correta mas ainda não entrou em vigor, apenas `reload`

## Por que precisamos de um `nb proxy` separado

Porque o que `nb proxy` deseja unificar não é um determinado arquivo de configuração do Nginx, mas as ações comuns da camada de entrada.

O que realmente importa para você geralmente não é:

-Em qual caminho está o arquivo de configuração?
- Diferenças de comando entre Nginx e Caddy
- Diferenças operacionais entre local e docker

O que você está mais preocupado é:

- Como faço para expor esse ambiente?
- Como altero meu nome de domínio?
- Como faço para que a nova configuração tenha efeito?

`nb proxy` é convergir essas ações para o mesmo conjunto de entradas CLI. Dessa forma, se você se lembrar primeiro do processo principal, já poderá cobrir a maioria dos cenários. Somente quando você quiser continuar solucionando os detalhes ou precisar de uma configuração especial, basta consultar a página do próprio provedor.

## Geral

- `nb proxy` O principal uso da mente é `use → generate → reload`
- Para a maioria dos usuários, lembrar destes 3 comandos é suficiente
- O foco do seu design não é esconder todos os detalhes, mas primeiro corrigir os processos de entrada mais comuns.

Se quiser continuar examinando os comandos específicos, você pode ir diretamente para [`nb proxy`](../../api/cli/proxy/index.md). Se você estiver pronto para se conectar à entrada oficial, também poderá continuar consultando [Reverse Proxy](../production/reverse-proxy/index.md).
