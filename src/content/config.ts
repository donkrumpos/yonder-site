import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    slug: z.string().optional(),
    status: z.enum(['published', 'draft']).default('published'),
    categories: z.array(z.string()).default([]),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    address: z.string().optional(),
    hero_quote: z.string().optional(),
    featured_image: z.string().optional(),
  }),
});

export const collections = { projects };
