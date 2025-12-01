import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// SEO schema (reusable)
const seoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().optional(),
  noIndex: z.boolean().optional(),
}).optional();

// Blog posts collection
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    published: z.boolean().default(false),
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).optional(),
    featuredImage: z.string().optional(),
    author: z.string().optional(),
    seo: seoSchema,
  }),
});

// Site settings singleton
const settings = defineCollection({
  loader: glob({ pattern: 'index.yaml', base: './src/content/settings' }),
  schema: z.object({
    companyName: z.string(),
    phone: z.string(),
    email: z.string(),
    salesEmail: z.string(),
    calendlyUrl: z.string(),
    socialLinks: z.object({
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      instagram: z.string().optional(),
    }),
  }),
});

// Page SEO schema (without noIndex since these are always indexed)
const pageSeoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
}).optional();

// Homepage content singleton
const homepage = defineCollection({
  loader: glob({ pattern: 'index.yaml', base: './src/content/homepage' }),
  schema: z.object({
    seo: pageSeoSchema,
    hero: z.object({
      headline: z.string(),
      subheadline: z.string(),
      ctaPrimary: z.string(),
      ctaPrimaryLink: z.string(),
      ctaSecondary: z.string(),
      ctaSecondaryLink: z.string(),
    }),
    stats: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })),
    howItWorks: z.object({
      headline: z.string(),
      subheadline: z.string(),
      steps: z.array(z.object({
        number: z.string(),
        title: z.string(),
        description: z.string(),
      })),
    }),
    features: z.object({
      tagline: z.string(),
      headline: z.string(),
      items: z.array(z.object({
        stat: z.string(),
        title: z.string(),
        description: z.string(),
      })),
    }),
    finalCta: z.object({
      headline: z.string(),
      subheadline: z.string(),
      buttonText: z.string(),
      buttonLink: z.string(),
    }),
  }),
});

// Pricing page singleton
const pricing = defineCollection({
  loader: glob({ pattern: 'index.yaml', base: './src/content/pricing' }),
  schema: z.object({
    seo: pageSeoSchema,
    headline: z.string(),
    subheadline: z.string(),
    tiers: z.array(z.object({
      name: z.string(),
      price: z.string(),
      period: z.string(),
      description: z.string(),
      highlighted: z.boolean(),
      ctaText: z.string(),
      features: z.array(z.object({
        text: z.string(),
        included: z.boolean(),
      })),
    })),
    faq: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })),
  }),
});

// Features page singleton
const featuresPage = defineCollection({
  loader: glob({ pattern: 'index.yaml', base: './src/content/features-page' }),
  schema: z.object({
    seo: pageSeoSchema,
    hero: z.object({
      headline: z.string(),
      headlineAccent: z.string(),
      subheadline: z.string(),
    }),
    sections: z.array(z.object({
      id: z.string(),
      number: z.string(),
      navLabel: z.string(),
      title: z.string(),
      tagline: z.string(),
      description: z.string(),
      image: z.string(),
      imageAlt: z.string(),
      highlights: z.array(z.string()),
      statValue: z.string(),
      statLabel: z.string(),
    })),
    integrationLogos: z.array(z.object({
      src: z.string(),
      name: z.string(),
    })),
    socialProof: z.object({
      headline: z.string(),
      results: z.array(z.object({
        businessName: z.string(),
        businessType: z.string(),
        logo: z.string(),
        quote: z.string(),
        author: z.string(),
        role: z.string(),
        metrics: z.array(z.object({
          label: z.string(),
          before: z.string(),
          after: z.string(),
        })),
      })),
    }),
    cta: z.object({
      headline: z.string(),
      subheadline: z.string(),
      primaryButtonText: z.string(),
      primaryButtonLink: z.string(),
      secondaryButtonText: z.string(),
      secondaryButtonLink: z.string(),
      trustSignals: z.string(),
    }),
  }),
});

// Blog page singleton
const blogPage = defineCollection({
  loader: glob({ pattern: 'index.yaml', base: './src/content/blog-page' }),
  schema: z.object({
    seo: pageSeoSchema,
    hero: z.object({
      tagline: z.string(),
      title: z.string(),
      subtitle: z.string(),
    }),
    newsletter: z.object({
      title: z.string(),
      text: z.string(),
      buttonText: z.string(),
      placeholder: z.string(),
    }),
  }),
});

// Testimonials collection
const testimonials = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/testimonials' }),
  schema: z.object({
    business: z.string(),
    quote: z.string(),
    author: z.string(),
    role: z.string(),
    logo: z.string().optional(),
    featured: z.boolean().default(true),
    order: z.number().default(0),
  }),
});

export const collections = {
  blog,
  settings,
  homepage,
  pricing,
  'features-page': featuresPage,
  'blog-page': blogPage,
  testimonials,
};
