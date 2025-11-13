import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://prayash-portfolio.vercel.app';
  const now = new Date();
  
  return [
    // Landing page - Tool dashboard
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    // SQL Query Builder
    {
      url: `${baseUrl}/tools/sql-builder`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    // Schema Designer
    {
      url: `${baseUrl}/tools/schema-designer`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // SQL Formatter
    {
      url: `${baseUrl}/tools/sql-formatter`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
  ]
}

