import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const githubUrl = 'https://github.com/TabletopFoundry/cratematch';

const config: Config = {
  title: 'CrateMatch',
  tagline: 'Personalized board game subscriptions, scored and explained.',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://tabletopfoundry.github.io',
  baseUrl: '/cratematch/',

  organizationName: 'TabletopFoundry',
  projectName: 'cratematch',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: [
    '@docusaurus/theme-mermaid',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: '/',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: `${githubUrl}/edit/main/website/`,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.svg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
    },
    metadata: [
      { name: 'keywords', content: 'board games, subscription, recommendation, curation, tabletop, crate, monthly box' },
      { name: 'og:type', content: 'website' },
      { name: 'og:title', content: 'CrateMatch — Personalized board game subscriptions' },
      { name: 'og:description', content: 'Content-based curation, collection intelligence, and transparent recommendation explanations for board gamers.' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    navbar: {
      title: 'CrateMatch',
      logo: {
        alt: 'CrateMatch logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        { to: '/getting-started/quick-start', label: 'Quick Start', position: 'left' },
        { to: '/reference/api', label: 'API', position: 'left' },
        { to: '/why', label: 'Why CrateMatch', position: 'left' },
        {
          href: githubUrl,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Quick Start', to: '/getting-started/quick-start' },
            { label: 'Core Concepts', to: '/concepts/overview' },
            { label: 'API Reference', to: '/reference/api' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'Why CrateMatch', to: '/why' },
            { label: 'Troubleshooting', to: '/troubleshooting' },
            { label: 'Changelog', to: '/changelog' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'GitHub', href: githubUrl },
            { label: 'Issues', href: `${githubUrl}/issues` },
            { label: 'Discussions', href: `${githubUrl}/discussions` },
            { label: 'Contributing', to: '/contributing' },
          ],
        },
      ],
      copyright: `MIT licensed. Built with Docusaurus. © ${new Date().getFullYear()} CrateMatch contributors.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'tsx'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
