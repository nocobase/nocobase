import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ptBR: LocaleResource<typeof enUS> = {
  access: {
    section: 'Versões',
    pages: {
      'rel-apps': 'Aplicativos',
    },
    businessSection: 'Versões',
    businesses: {
      apps: {
        title: 'Aplicativos',
        description:
          'Aplicativos, seus lançamentos, implantações e tempo de execução.',
        actions: {
          view: {
            title: 'Ver aplicativos',
            description:
              'Veja Apps, seus lançamentos, implantações e status de tempo de execução',
            related: 'Ver aplicativos (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Ver aplicativos (todos)',
          },
          readLogs: {
            title: 'Ler registros',
            description: 'Ler registros de aplicativos e implantação',
            related: 'Ler logs (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Ler logs (todos)',
          },
          create: {
            title: 'Criar aplicativos',
            description: 'Criar aplicativos em um ambiente',
            all: 'Criar aplicativos',
          },
          configure: {
            title: 'Configurar aplicativos',
            description:
              'Ler e alterar a configuração de um aplicativo, que pode conter segredos',
            related: 'Configurar aplicativos (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Configurar aplicativos (todos)',
          },
          upload: {
            title: 'Carregar versões',
            description: 'Carregar e promover lançamentos',
            related: 'Carregar lançamentos (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Carregar versões (todas)',
          },
          deploy: {
            title: 'Implantar',
            description:
              'Implantar e reverter em ambientes desprotegidos, solicitar implantações em ambientes protegidos',
            related: 'Implantar (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Implantar (todos)',
          },
          deployProtected: {
            title: 'Aprovar implantações protegidas',
            description:
              'Aprovar implantações em ambientes protegidos que não nomeiam aprovadores; apenas pessoas',
            related:
              'Aprovar implantações protegidas (aquelas relacionadas a elas)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Aprovar implantações protegidas (todas)',
          },
          operate: {
            title: 'Iniciar e parar',
            description: 'Iniciar, parar e reiniciar aplicativos',
            related: 'Iniciar e parar (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Iniciar e parar (todos)',
          },
          delete: {
            title: 'Excluir aplicativos',
            description: 'Excluir um aplicativo com seus dados',
            related: 'Excluir aplicativos (aqueles relacionados a eles)',
            relatedLabel: 'Aqueles que eu criei',
            relatedHint:
              'Aplicativos que criei e qualquer aplicativo relacionado a mim',
            all: 'Excluir aplicativos (todos)',
          },
        },
      },
    },
    recordAccess: {
      owned: 'Aplicativos que eles criaram',
    },
    settings: {
      rel: {
        environments: 'Implantar ambientes',
      },
    },
    keyScopes: {
      apps: {
        title: 'Aplicativos e implantações',
        description:
          'Leia: veja aplicativos, versões, implantações e logs. Ler e escrever: também fazer upload de lançamentos. Administrador: também implante e inicie ou interrompa aplicativos.',
        objects: 'Aplicativos',
      },
      environments: {
        title: 'Implantar ambientes',
        description: 'Leia: listar ambientes. Ler e escrever: gerencie-os.',
      },
      presets: {
        ciDeploy: {
          title: 'Implantação de CI',
          description:
            'Faça upload de versões para os aplicativos escolhidos e implante-os por 90 dias.',
        },
        ciUpload: {
          title: 'Carregamento de CI',
          description:
            'Carregar versões para os aplicativos escolhidos sem implantá-los, por 90 dias.',
        },
      },
    },
    actions: {
      read: 'Visualizar',
      manage: 'Gerenciar',
      view: 'Visualizar',
      'read-logs': 'Ler registros',
      create: 'Criar',
      configure: 'Configurar',
      upload: 'Carregar versões',
      deploy: 'Implantar',
      'deploy-protected': 'Aprovar implantações protegidas',
      operate: 'Iniciar e parar',
      delete: 'Excluir',
    },
  },
  drivers: {
    host: 'Este servidor',
  },
};

export default ptBR;
