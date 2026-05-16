import { useEffect } from 'react';

interface AnalyticsProps {
  measurementId?: string;
}

export default function Analytics({ measurementId }: AnalyticsProps) {
  useEffect(() => {
    if (!measurementId) return;

    // Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    `;
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [measurementId]);

  return null;
}

// Track page views
export function trackPageView(path: string, title: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: path,
      page_title: title
    });
  }
}

// Track custom events
export function trackEvent(category: string, action: string, label?: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label
    });
  }
}

// Track article views
export function trackArticleView(articleId: string, articleTitle: string) {
  trackEvent('Article', 'view', articleTitle);
}

// Track click events
export function trackClick(element: string, destination: string) {
  trackEvent('Click', element, destination);
}