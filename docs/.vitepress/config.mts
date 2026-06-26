import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@thecodepace/fastify-http-query',
  description: 'Fastify plugin that enables the HTTP QUERY method.',
  base: '/fastify-http-query/',
  lastUpdated: true,
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/what-is-query' },
      { text: 'API', link: '/api/' },
      { text: 'Errors', link: '/errors/' },
      {
        text: 'v0.0.3',
        items: [
          { text: 'Changelog', link: 'https://github.com/TheCodePace/fastify-http-query/blob/main/CHANGELOG.md' },
          { text: 'GitHub', link: 'https://github.com/TheCodePace/fastify-http-query' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@thecodepace/fastify-http-query' }
        ]
      }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is HTTP QUERY?', link: '/guide/what-is-query' },
            { text: 'Why this plugin?', link: '/guide/why-this-plugin' }
          ]
        },
        {
          text: 'Usage',
          items: [
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick start', link: '/guide/quick-start' },
            { text: 'Caching & conditional requests', link: '/guide/caching' },
            { text: 'Content-Location', link: '/guide/content-location' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [{ text: 'Overview', link: '/api/' }]
        }
      ],
      '/errors/': [
        {
          text: 'Error Codes',
          items: [{ text: 'Overview', link: '/errors/' }]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/TheCodePace/fastify-http-query' }
    ],
    editLink: {
      pattern: 'https://github.com/TheCodePace/fastify-http-query/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © TheCodePace'
    }
  }
})
