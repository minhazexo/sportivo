import { useEffect } from 'react';

interface AdSenseProps {
  adClient: string;
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

export default function AdSense({ 
  adClient, 
  adSlot, 
  adFormat = 'auto',
  className = '' 
}: AdSenseProps) {
  useEffect(() => {
    // Load AdSense script
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);

    return () => {
      // Clean up on unmount
      try {
        document.head.removeChild(script);
      } catch (e) {}
    };
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
    />
  );
}

// Banner Ad Component
export function BannerAd({ className = '' }: { className?: string }) {
  return (
    <div className={`my-8 ${className}`}>
      <AdSense 
        adClient="ca-pub-XXXXXXXXXX" 
        adSlot="1234567890" 
        adFormat="horizontal"
      />
    </div>
  );
}

// Sidebar Ad Component
export function SidebarAd({ className = '' }: { className?: string }) {
  return (
    <div className={`my-8 ${className}`}>
      <AdSense 
        adClient="ca-pub-XXXXXXXXXX" 
        adSlot="1234567891" 
        adFormat="vertical"
      />
    </div>
  );
}

// In-Article Ad Component
export function InArticleAd({ className = '' }: { className?: string }) {
  return (
    <div className={`my-8 ${className}`}>
      <AdSense 
        adClient="ca-pub-XXXXXXXXXX" 
        adSlot="1234567892" 
        adFormat="rectangle"
      />
    </div>
  );
}

// Footer Ad Component
export function FooterAd({ className = '' }: { className?: string }) {
  return (
    <div className={`my-8 ${className}`}>
      <AdSense 
        adClient="ca-pub-XXXXXXXXXX" 
        adSlot="1234567893" 
        adFormat="horizontal"
      />
    </div>
  );
}