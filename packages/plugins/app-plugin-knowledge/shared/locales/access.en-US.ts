const accessEnUS = {
  access: {
    businessSection: 'Knowledge',
    businesses: {
      knowledge: {
        title: 'Knowledge',
        description: 'The documents of each knowledge space.',
        actions: {
          read: {
            title: 'Read knowledge',
            description:
              'Read the system knowledge and that of the spaces related to them',
            related: 'Read knowledge (spaces related to them)',
            relatedLabel: 'Spaces related to me',
            relatedHint: 'The application decides which spaces relate to whom',
            all: 'Read knowledge (all)',
          },
          propose: {
            title: 'Propose knowledge',
            description:
              'Propose a change for someone who may edit to decide; what agents may be given',
            related: 'Propose knowledge (spaces related to them)',
            relatedLabel: 'Spaces related to me',
            relatedHint: 'The application decides which spaces relate to whom',
            all: 'Propose knowledge (all)',
          },
          edit: {
            title: 'Edit knowledge',
            description:
              'Edit, archive and mark verified, and decide proposals; system knowledge needs all',
            related: 'Edit knowledge (spaces related to them)',
            relatedLabel: 'Spaces related to me',
            relatedHint: 'The application decides which spaces relate to whom',
            all: 'Edit knowledge (all)',
          },
          manage: {
            title: 'Manage knowledge access',
            description:
              'Change who may access each folder and article, and keep access to all of it; system knowledge needs all',
            related: 'Manage knowledge access (spaces related to them)',
            relatedLabel: 'Spaces related to me',
            relatedHint: 'The application decides which spaces relate to whom',
            all: 'Manage knowledge access (all)',
          },
        },
      },
    },
  },
};

export default accessEnUS;
