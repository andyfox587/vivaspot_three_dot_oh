import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  ui: {
    brand: { name: 'VivaSpot' },
  },
  singletons: {
    // ============================================
    // SITE SETTINGS
    // ============================================
    settings: singleton({
      label: 'Site Settings',
      path: 'src/content/settings/index',
      format: { data: 'yaml' },
      schema: {
        companyName: fields.text({ label: 'Company Name', defaultValue: 'VivaSpot' }),
        phone: fields.text({ label: 'Phone Number', defaultValue: '1-855-383-4662' }),
        email: fields.text({ label: 'Email', defaultValue: 'support@vivaspot.com' }),
        salesEmail: fields.text({ label: 'Sales Email', defaultValue: 'sales@vivaspot.com' }),
        calendlyUrl: fields.url({ label: 'Calendly URL', defaultValue: 'https://calendly.com/vivaspot' }),
        socialLinks: fields.object({
          facebook: fields.url({ label: 'Facebook URL' }),
          twitter: fields.url({ label: 'Twitter URL' }),
          linkedin: fields.url({ label: 'LinkedIn URL' }),
          instagram: fields.url({ label: 'Instagram URL' }),
        }, { label: 'Social Media Links' }),
      },
    }),

    // ============================================
    // HOMEPAGE
    // ============================================
    homepage: singleton({
      label: 'Homepage',
      path: 'src/content/homepage/index',
      format: { data: 'yaml' },
      schema: {
        // SEO Fields
        seo: fields.object({
          metaTitle: fields.text({
            label: 'Meta Title',
            description: 'Title for search engines (50-60 characters ideal)',
            defaultValue: 'VivaSpot - Guest WiFi Marketing Platform',
          }),
          metaDescription: fields.text({
            label: 'Meta Description',
            description: 'Description for search engines (150-160 characters ideal)',
            multiline: true,
            defaultValue: 'Turn your guest WiFi into a powerful marketing tool. Capture leads, automate campaigns, and grow your business with VivaSpot.',
          }),
        }, { label: 'SEO Settings' }),
        hero: fields.object({
          headline: fields.text({ label: 'Headline', multiline: true }),
          subheadline: fields.text({ label: 'Subheadline', multiline: true }),
          ctaPrimary: fields.text({ label: 'Primary CTA Text', defaultValue: 'Start Free Trial' }),
          ctaPrimaryLink: fields.text({ label: 'Primary CTA Link', defaultValue: '/contact' }),
          ctaSecondary: fields.text({ label: 'Secondary CTA Text', defaultValue: 'Watch Demo' }),
          ctaSecondaryLink: fields.text({ label: 'Secondary CTA Link', defaultValue: '/book-a-meeting' }),
        }, { label: 'Hero Section' }),

        stats: fields.array(
          fields.object({
            value: fields.text({ label: 'Value (e.g., "35%", "10M+")' }),
            label: fields.text({ label: 'Label' }),
          }),
          {
            label: 'Stats',
            itemLabel: props => props.fields.label.value || 'Stat',
          }
        ),

        howItWorks: fields.object({
          headline: fields.text({ label: 'Section Headline', defaultValue: 'How It Works' }),
          subheadline: fields.text({ label: 'Section Subheadline', multiline: true }),
          steps: fields.array(
            fields.object({
              number: fields.text({ label: 'Step Number' }),
              title: fields.text({ label: 'Title' }),
              description: fields.text({ label: 'Description', multiline: true }),
            }),
            {
              label: 'Steps',
              itemLabel: props => props.fields.title.value || 'Step',
            }
          ),
        }, { label: 'How It Works Section' }),

        features: fields.object({
          headline: fields.text({ label: 'Section Headline', defaultValue: 'More Than Just WiFi' }),
          tagline: fields.text({ label: 'Section Tagline', defaultValue: 'Powerful Features' }),
          items: fields.array(
            fields.object({
              stat: fields.text({ label: 'Stat (e.g., "98%")' }),
              title: fields.text({ label: 'Title' }),
              description: fields.text({ label: 'Description', multiline: true }),
            }),
            {
              label: 'Feature Items',
              itemLabel: props => props.fields.title.value || 'Feature',
            }
          ),
        }, { label: 'Features Section' }),

        finalCta: fields.object({
          headline: fields.text({ label: 'Headline' }),
          subheadline: fields.text({ label: 'Subheadline', multiline: true }),
          buttonText: fields.text({ label: 'Button Text', defaultValue: 'Get Started Free' }),
          buttonLink: fields.text({ label: 'Button Link', defaultValue: '/contact' }),
        }, { label: 'Final CTA Section' }),
      },
    }),

    // ============================================
    // PRICING PAGE
    // ============================================
    pricing: singleton({
      label: 'Pricing Page',
      path: 'src/content/pricing/index',
      format: { data: 'yaml' },
      schema: {
        // SEO Fields
        seo: fields.object({
          metaTitle: fields.text({
            label: 'Meta Title',
            description: 'Title for search engines (50-60 characters ideal)',
            defaultValue: 'Pricing - Guest WiFi Marketing Plans | VivaSpot',
          }),
          metaDescription: fields.text({
            label: 'Meta Description',
            description: 'Description for search engines (150-160 characters ideal)',
            multiline: true,
            defaultValue: 'Simple, transparent pricing for guest WiFi marketing. Start free and upgrade as your business grows. No hidden fees.',
          }),
        }, { label: 'SEO Settings' }),
        headline: fields.text({ label: 'Page Headline', defaultValue: 'Simple, transparent pricing' }),
        subheadline: fields.text({ label: 'Page Subheadline', multiline: true }),

        tiers: fields.array(
          fields.object({
            name: fields.text({ label: 'Tier Name' }),
            price: fields.text({ label: 'Price (e.g., "$19")' }),
            period: fields.text({ label: 'Period', defaultValue: '/mo' }),
            description: fields.text({ label: 'Short Description', multiline: true }),
            highlighted: fields.checkbox({ label: 'Highlight this tier?', defaultValue: false }),
            ctaText: fields.text({ label: 'CTA Button Text', defaultValue: 'Get Started' }),
            features: fields.array(
              fields.object({
                text: fields.text({ label: 'Feature' }),
                included: fields.checkbox({ label: 'Included?', defaultValue: true }),
              }),
              {
                label: 'Features',
                itemLabel: props => props.fields.text.value || 'Feature',
              }
            ),
          }),
          {
            label: 'Pricing Tiers',
            itemLabel: props => props.fields.name.value || 'Tier',
          }
        ),

        faq: fields.array(
          fields.object({
            question: fields.text({ label: 'Question' }),
            answer: fields.text({ label: 'Answer', multiline: true }),
          }),
          {
            label: 'FAQ',
            itemLabel: props => props.fields.question.value || 'Question',
          }
        ),
      },
    }),

    // ============================================
    // FEATURES PAGE
    // ============================================
    featuresPage: singleton({
      label: 'Features Page',
      path: 'src/content/features-page/index',
      format: { data: 'yaml' },
      schema: {
        // SEO Fields
        seo: fields.object({
          metaTitle: fields.text({
            label: 'Meta Title',
            description: 'Title for search engines (50-60 characters ideal)',
            defaultValue: 'Features - Guest WiFi Marketing & Automation | VivaSpot',
          }),
          metaDescription: fields.text({
            label: 'Meta Description',
            description: 'Description for search engines (150-160 characters ideal)',
            multiline: true,
            defaultValue: 'Discover powerful guest WiFi marketing features: capture leads, automate campaigns, win back customers, and integrate with your favorite tools.',
          }),
        }, { label: 'SEO Settings' }),
        // Hero Section
        hero: fields.object({
          headline: fields.text({ label: 'Headline (main text)' }),
          headlineAccent: fields.text({ label: 'Headline Accent (orange text)' }),
          subheadline: fields.text({ label: 'Subheadline', multiline: true }),
        }, { label: 'Hero Section' }),

        // Feature Sections
        sections: fields.array(
          fields.object({
            id: fields.text({ label: 'ID (for anchor links, e.g., "capture")' }),
            number: fields.text({ label: 'Section Number (e.g., "01")' }),
            navLabel: fields.text({ label: 'Navigation Label' }),
            title: fields.text({ label: 'Section Title' }),
            tagline: fields.text({ label: 'Section Tagline' }),
            description: fields.text({ label: 'Description', multiline: true }),
            image: fields.text({ label: 'Image Path' }),
            imageAlt: fields.text({ label: 'Image Alt Text' }),
            highlights: fields.array(
              fields.text({ label: 'Highlight' }),
              { label: 'Highlight Items', itemLabel: props => props.value || 'Highlight' }
            ),
            statValue: fields.text({ label: 'Stat Value (e.g., "35%")' }),
            statLabel: fields.text({ label: 'Stat Label (e.g., "Average Capture Rate")' }),
          }),
          {
            label: 'Feature Sections',
            itemLabel: props => props.fields.navLabel.value || 'Section',
          }
        ),

        // Integration Logos
        integrationLogos: fields.array(
          fields.object({
            src: fields.text({ label: 'Logo Image Path' }),
            name: fields.text({ label: 'Company Name' }),
          }),
          {
            label: 'Integration Logos',
            itemLabel: props => props.fields.name.value || 'Logo',
          }
        ),

        // Social Proof Section
        socialProof: fields.object({
          headline: fields.text({ label: 'Headline', defaultValue: 'Real Businesses. Real Results.' }),
          results: fields.array(
            fields.object({
              businessName: fields.text({ label: 'Business Name' }),
              businessType: fields.text({ label: 'Business Type (e.g., "Restaurant")' }),
              logo: fields.text({ label: 'Logo Path' }),
              quote: fields.text({ label: 'Quote', multiline: true }),
              author: fields.text({ label: 'Author Name' }),
              role: fields.text({ label: 'Author Role' }),
              metrics: fields.array(
                fields.object({
                  label: fields.text({ label: 'Metric Label' }),
                  before: fields.text({ label: 'Before Value' }),
                  after: fields.text({ label: 'After Value' }),
                }),
                { label: 'Metrics', itemLabel: props => props.fields.label.value || 'Metric' }
              ),
            }),
            {
              label: 'Business Results',
              itemLabel: props => props.fields.businessName.value || 'Business',
            }
          ),
        }, { label: 'Social Proof Section' }),

        // CTA Section
        cta: fields.object({
          headline: fields.text({ label: 'Headline' }),
          subheadline: fields.text({ label: 'Subheadline', multiline: true }),
          primaryButtonText: fields.text({ label: 'Primary Button Text', defaultValue: 'Start Free Trial' }),
          primaryButtonLink: fields.text({ label: 'Primary Button Link', defaultValue: '/contact' }),
          secondaryButtonText: fields.text({ label: 'Secondary Button Text', defaultValue: 'View Pricing' }),
          secondaryButtonLink: fields.text({ label: 'Secondary Button Link', defaultValue: '/pricing' }),
          trustSignals: fields.text({ label: 'Trust Signals Text' }),
        }, { label: 'CTA Section' }),
      },
    }),

    // ============================================
    // BLOG PAGE
    // ============================================
    blogPage: singleton({
      label: 'Blog Page',
      path: 'src/content/blog-page/index',
      format: { data: 'yaml' },
      schema: {
        // SEO Fields
        seo: fields.object({
          metaTitle: fields.text({
            label: 'Meta Title',
            description: 'Title for search engines (50-60 characters ideal)',
            defaultValue: 'WiFi Marketing Blog - Tips & Insights | VivaSpot',
          }),
          metaDescription: fields.text({
            label: 'Meta Description',
            description: 'Description for search engines (150-160 characters ideal)',
            multiline: true,
            defaultValue: 'Expert tips on guest WiFi marketing, customer engagement, and restaurant marketing. Learn strategies to grow your business.',
          }),
        }, { label: 'SEO Settings' }),
        hero: fields.object({
          tagline: fields.text({ label: 'Tagline', defaultValue: 'Our Blog' }),
          title: fields.text({ label: 'Title', defaultValue: 'WiFi Marketing Insights' }),
          subtitle: fields.text({ label: 'Subtitle', multiline: true }),
        }, { label: 'Hero Section' }),
        newsletter: fields.object({
          title: fields.text({ label: 'Title', defaultValue: 'Stay in the loop' }),
          text: fields.text({ label: 'Description', multiline: true }),
          buttonText: fields.text({ label: 'Button Text', defaultValue: 'Subscribe' }),
          placeholder: fields.text({ label: 'Input Placeholder', defaultValue: 'Enter your email' }),
        }, { label: 'Newsletter Section' }),
      },
    }),
  },

  collections: {
    // ============================================
    // BLOG POSTS
    // ============================================
    blog: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/blog/*/',
      format: { contentField: 'content' },
      previewUrl: '/preview/blog/{slug}',
      schema: {
        published: fields.checkbox({
          label: 'Published',
          description: 'When checked, this post is visible on the live site',
          defaultValue: false,
        }),
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Publish Date' }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true, validation: { isRequired: true } }),
        featuredImage: fields.image({
          label: 'Featured Image',
          directory: 'public/images/blog',
          publicPath: '/images/blog',
        }),
        categories: fields.multiselect({
          label: 'Categories',
          options: [
            { label: 'Marketing', value: 'Marketing' },
            { label: 'Technology', value: 'Technology' },
            { label: 'Insights', value: 'Insights' },
            { label: 'WiFi Marketing', value: 'Wifi Marketing' },
            { label: 'Business', value: 'Business' },
            { label: 'Software', value: 'Software' },
            { label: 'Presence Marketing', value: 'Presence Marketing' },
            { label: 'Covid-19', value: 'Covid-19' },
            { label: 'Uncategorized', value: 'Uncategorized' },
          ],
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags' }),
        // SEO Fields
        seo: fields.object({
          metaTitle: fields.text({
            label: 'Meta Title',
            description: 'Override the title tag (defaults to post title if empty)',
          }),
          metaDescription: fields.text({
            label: 'Meta Description',
            description: 'Override the meta description (defaults to excerpt if empty)',
            multiline: true,
          }),
          canonicalUrl: fields.url({
            label: 'Canonical URL',
            description: 'Set a canonical URL if this content exists elsewhere',
          }),
          noIndex: fields.checkbox({
            label: 'No Index',
            description: 'Prevent search engines from indexing this page',
            defaultValue: false,
          }),
        }, { label: 'SEO Settings' }),
        content: fields.markdoc({
          label: 'Content',
          options: {
            image: {
              directory: 'public/images/blog',
              publicPath: '/images/blog',
            },
          },
        }),
      },
    }),

    // ============================================
    // TESTIMONIALS
    // ============================================
    testimonials: collection({
      label: 'Testimonials',
      slugField: 'business',
      path: 'src/content/testimonials/*',
      format: { data: 'yaml' },
      schema: {
        business: fields.slug({ name: { label: 'Business Name' } }),
        quote: fields.text({ label: 'Quote', multiline: true }),
        author: fields.text({ label: 'Author Name' }),
        role: fields.text({ label: 'Role/Title' }),
        logo: fields.image({
          label: 'Business Logo',
          directory: 'public/images/logos',
          publicPath: '/images/logos',
        }),
        featured: fields.checkbox({ label: 'Show on Homepage?', defaultValue: true }),
        order: fields.number({ label: 'Display Order', defaultValue: 0 }),
      },
    }),
  },
});
