import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/swaps/', '/profile', '/items/new'],
      },
    ],
    sitemap: 'https://www.dropswap.co.uk/sitemap.xml',
  }
}
