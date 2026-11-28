import type { KnowledgeServerResource } from './en-US.js';

const esES: KnowledgeServerResource = {
  access: {
    businessSection: 'Conocimiento',
    businesses: {
      knowledge: {
        title: 'Conocimiento',
        description: 'Los documentos de cada espacio de conocimiento.',
        actions: {
          read: {
            title: 'Leer conocimiento',
            description:
              'Leer el conocimiento del sistema y el de los espacios relacionados con ellos',
            related: 'Leer conocimientos (espacios relacionados con ellos)',
            relatedLabel: 'Espacios relacionados conmigo',
            relatedHint:
              'La aplicación decide qué espacios se relacionan con quién',
            all: 'Leer conocimientos (todos)',
          },
          propose: {
            title: 'Proponer conocimiento',
            description:
              'Proponer un cambio para que alguien que pueda editar decida; qué agentes se pueden administrar',
            related: 'Proponer conocimientos (espacios relacionados con ellos)',
            relatedLabel: 'Espacios relacionados conmigo',
            relatedHint:
              'La aplicación decide qué espacios se relacionan con quién',
            all: 'Proponer conocimientos (todos)',
          },
          edit: {
            title: 'Editar conocimiento',
            description:
              'Editar, archivar y marcar como verificadas y decidir las propuestas; el conocimiento del sistema necesita todo',
            related: 'Editar conocimientos (espacios relacionados con ellos)',
            relatedLabel: 'Espacios relacionados conmigo',
            relatedHint:
              'La aplicación decide qué espacios se relacionan con quién',
            all: 'Editar conocimientos (todos)',
          },
          manage: {
            title: 'Gestionar el acceso al conocimiento',
            description:
              'Cambiar quién puede acceder a cada carpeta y artículo, y mantener el acceso a todos ellos; el conocimiento del sistema necesita todo',
            related:
              'Gestionar el acceso al conocimiento (espacios relacionados con los mismos)',
            relatedLabel: 'Espacios relacionados conmigo',
            relatedHint:
              'La aplicación decide qué espacios se relacionan con quién',
            all: 'Administrar el acceso al conocimiento (todos)',
          },
        },
      },
    },
  },
};

export default esES;
