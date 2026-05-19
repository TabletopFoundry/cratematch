import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'doc',
      id: 'index',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/quick-start',
        'getting-started/installation',
        'getting-started/first-recommendation',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'concepts/overview',
        'concepts/taste-profile',
        'concepts/recommendation-engine',
        'concepts/collection-intelligence',
        'concepts/architecture',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/seed-demo-data',
        'guides/customize-catalog',
        'guides/tune-scoring',
        'guides/deploy',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/api',
        'reference/configuration',
        'reference/data-model',
        'reference/scripts',
      ],
    },
    'why',
    'troubleshooting',
    'contributing',
    'changelog',
  ],
};

export default sidebars;
