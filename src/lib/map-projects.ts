import { getCollection } from 'astro:content';
import type { MapProject } from '@components/maps/ProjectMap';

/**
 * Load every published project that has parseable lat/lng frontmatter,
 * shaped for the ProjectMap component. Used by the per-project map and
 * the standalone /murals page.
 */
export async function getMapProjects(): Promise<MapProject[]> {
  const all = await getCollection('projects', ({ data }) => data.status === 'published');
  return all
    .map((p) => {
      const lat = parseFloat(p.data.latitude ?? '');
      const lng = parseFloat(p.data.longitude ?? '');
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        slug: p.slug,
        title: p.data.title,
        lat,
        lng,
        year: p.data.date.getFullYear(),
        featuredImage: p.data.featured_image ?? undefined,
      };
    })
    .filter((p): p is MapProject => p !== null);
}
