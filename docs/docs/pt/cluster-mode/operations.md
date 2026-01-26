:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Procedimentos de Manutenção

## Primeira Inicialização do Aplicativo

Quando for iniciar o aplicativo pela primeira vez, você deve primeiro iniciar um dos nós. Espere os **plugins** serem instalados e ativados, e só então inicie os outros nós.

## Atualização de Versão

Quando precisar atualizar a versão do NocoBase, siga este procedimento.

:::warning{title=Atenção}
Em um **ambiente de produção** em cluster, funcionalidades como gerenciamento de **plugins** e atualizações de versão devem ser usadas com cautela ou proibidas.

Atualmente, o NocoBase não oferece suporte a atualizações online para versões em cluster. Para garantir a consistência dos dados, os serviços externos precisam ser suspensos durante o processo de atualização.
:::

Passos:

1.  Pare o serviço atual

    Pare todas as instâncias do aplicativo NocoBase e redirecione o tráfego do balanceador de carga para uma página de status 503.

2.  Faça backup dos dados

    Antes de atualizar, é altamente recomendável fazer backup dos dados do banco de dados para evitar quaisquer problemas durante o processo de atualização.

3.  Atualize a versão

    Consulte [Atualização Docker](../get-started/upgrading/docker) para atualizar a versão da imagem do aplicativo NocoBase.

4.  Inicie o serviço

    1.  Inicie um nó no cluster e espere a atualização ser concluída e o nó iniciar com sucesso.
    2.  Verifique se a funcionalidade está correta. Se houver algum problema que não possa ser resolvido com a solução de problemas, você pode reverter para a versão anterior.
    3.  Inicie os outros nós.
    4.  Redirecione o tráfego do balanceador de carga para o cluster do aplicativo.

## Manutenção no Aplicativo

A manutenção no aplicativo se refere à execução de operações relacionadas à manutenção enquanto o aplicativo está em execução, incluindo:

*   Gerenciamento de **plugins** (instalar, habilitar, desabilitar **plugins**, etc.)
*   Backup e Restauração
*   Gerenciamento de Migração de Ambiente

Passos:

1.  Reduza os nós

    Reduza o número de nós do aplicativo em execução no cluster para um, e pare o serviço nos outros nós.

2.  Realize operações de manutenção no aplicativo, como instalar e habilitar **plugins**, fazer backup de dados, etc.

3.  Restaure os nós

    Após a conclusão das operações de manutenção e a verificação da funcionalidade, inicie os outros nós. Depois que os nós iniciarem com sucesso, restaure o estado operacional do cluster.