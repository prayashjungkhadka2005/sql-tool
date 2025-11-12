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
  ]
}

