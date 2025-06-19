import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

export default function SEOHead({
  title = 'RDW Intelligence - Nederlandse Voertuig Informatie',
  description = 'Zoek alle Nederlandse voertuigen op kenteken, controleer trekgewicht en bekijk complete RDW data. 15+ miljoen voertuigen, 100% officiële RDW informatie.',
  keywords = 'RDW, kenteken opzoeken, voertuig informatie, trekgewicht check, APK, Nederlandse voertuigen',
  canonicalUrl,
  ogImage = 'https://rdw-intelligence.vercel.app/og-image.jpg',
  ogType = 'website',
  noIndex = false
}: SEOHeadProps) {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', keywords);
    
    // Update robots meta
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', noIndex ? 'noindex, nofollow' : 'index, follow');
    
    // Update canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalUrl) {
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.href = canonicalUrl;
    }
    
    // Update Open Graph tags
    const updateOGTag = (property: string, content: string) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute('content', content);
    };
    
    updateOGTag('og:title', title);
    updateOGTag('og:description', description);
    updateOGTag('og:image', ogImage);
    updateOGTag('og:type', ogType);
    if (canonicalUrl) {
      updateOGTag('og:url', canonicalUrl);
    }
    
    // Update Twitter Card tags
    const updateTwitterTag = (name: string, content: string) => {
      let twitterTag = document.querySelector(`meta[name="${name}"]`);
      if (!twitterTag) {
        twitterTag = document.createElement('meta');
        twitterTag.setAttribute('name', name);
        document.head.appendChild(twitterTag);
      }
      twitterTag.setAttribute('content', content);
    };
    
    updateTwitterTag('twitter:title', title);
    updateTwitterTag('twitter:description', description);
    updateTwitterTag('twitter:image', ogImage);
    
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, noIndex]);
  
  return null; // This component doesn't render anything
} 