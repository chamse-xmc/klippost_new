import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/app/', '/coach/', '/settings/', '/analysis/'],
    },
    sitemap: 'https://klippost.co/sitemap.xml',
  };
}
