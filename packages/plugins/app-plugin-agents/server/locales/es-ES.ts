import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  access: {
    section: 'Equipo de agentes',
    businessSection: 'Equipo de agentes',
    businesses: {
      agents: {
        title: 'Agentes y habilidades',
        description: 'Los agentes del equipo y las habilidades que utilizan.',
        actions: {
          edit: {
            title: 'Agents de cambio y habilidades',
            description:
              'Cambiar la configuración, habilidades y variables de un Agent, archivarlo, restaurarlo y eliminarlo, y editar habilidades. Un Agent no tiene ninguna capacidad más allá de la del editor.',
            related:
              'Agents de cambio y habilidades (Agents que poseen y habilidades que crearon)',
            relatedLabel: 'Agentes que poseo y habilidades que creé',
            relatedHint:
              'Agentes de los que soy propietario y habilidades que creé',
            all: 'Agents de cambio y habilidades (todos)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Agentes',
        runners: 'Entornos de ejecución',
        prices: 'Precios de los modelos',
        services: 'Servicios modelo',
      },
    },
    actions: {
      read: 'Ver',
      manage: 'Administrar',
    },
    keyScopes: {
      agents: {
        title: 'Agentes',
        description:
          'Ver Agents, habilidades y carreras; cambiar Agents y habilidades, cancelar y reintentar ejecuciones.',
      },
      runners: {
        title: 'Entornos de ejecución',
        description:
          'Ver entornos de ejecución y tokens de registro; gestionar entornos de ejecución.',
      },
      prices: {
        title: 'Precios de los modelos',
        description:
          'Véase el modelo a partir del cual se estiman los precios; cambiarlos.',
      },
      services: {
        title: 'Servicios modelo',
        description:
          'Ver los servicios modelo y los modelos que ofrecen, nunca sus claves.',
      },
    },
  },
  runnerConversation: {
    title: 'Conversación: {{title}}',
    other: 'Conversación de otra persona',
    untitled: 'Nueva conversación',
  },
};

export default esES;
