import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  jsonLd?: Record<string, unknown>;
}

const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:3000';
const SITE_NAME = 'Sportivo';
const DEFAULT_DESCRIPTION = 'Your premium source for sports news, live scores, and in-depth analysis across football, basketball, cricket, tennis, and more.';
const DEFAULT_OG_IMAGE = '/og-image.jpg';

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  article,
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const url = canonicalUrl || SITE_URL;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name: string, content: string, attr = 'name') => {
      let element = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    const setPropertyMeta = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    setMeta('description', description);
    setMeta('keywords', 'sports news, live scores, football, basketball, cricket, tennis, F1, NBA, Premier League');
    setMeta('robots', 'index, follow');
    setMeta('author', SITE_NAME);
    setMeta('theme-color', '#000000');

    setPropertyMeta('og:title', fullTitle);
    setPropertyMeta('og:description', description);
    setPropertyMeta('og:type', ogType);
    setPropertyMeta('og:url', url);
    setPropertyMeta('og:image', ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`);
    setPropertyMeta('og:site_name', SITE_NAME);
    setPropertyMeta('og:locale', 'en_US');

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle, 'name');
    setMeta('twitter:description', description, 'name');
    setMeta('twitter:image', ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`, 'name');

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    if (article) {
      setPropertyMeta('article:published_time', article.publishedTime || '');
      setPropertyMeta('article:modified_time', article.modifiedTime || '');
      setPropertyMeta('article:author', article.author || '');
      setPropertyMeta('article:section', article.section || '');
      if (article.tags) {
        article.tags.forEach(tag => {
          setPropertyMeta('article:tag', tag);
        });
      }
    }

    let jsonLdScript = document.getElementById('json-ld') as HTMLScriptElement;
    if (jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'json-ld';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(jsonLd);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

    return () => {
    };
  }, [fullTitle, description, url, ogImage, ogType, article, jsonLd]);

  return null;
}

export function generateArticleJsonLd(article: {
  title: string;
  description: string;
  image: string;
  publishedTime: string;
  modifiedTime?: string;
  author: string;
  url: string;
  section?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description,
    image: article.image.startsWith('http') ? article.image : `${SITE_URL}${article.image}`,
    datePublished: article.publishedTime,
    dateModified: article.modifiedTime || article.publishedTime,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    articleSection: article.section || 'Sports',
  };
}

export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      'https://twitter.com/sportivo',
      'https://facebook.com/sportivo',
      'https://instagram.com/sportivo',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@sportivo.com',
    },
  };
}

export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}
