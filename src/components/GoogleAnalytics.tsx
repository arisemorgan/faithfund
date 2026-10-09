import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

interface GoogleAnalyticsProps {
  measurementId?: string;
  tagManagerId?: string;
}

export const GoogleAnalytics: React.FC<GoogleAnalyticsProps> = ({
  measurementId = 'G-XXXXXXXXXX', // Replace with your GA4 measurement ID
  tagManagerId = 'GTM-XXXXXXX', // Replace with your GTM ID
}) => {
  const location = useLocation();

  useEffect(() => {
    // Initialize dataLayer for GTM
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    };

    // Load Google Analytics
    if (measurementId && measurementId !== 'G-XXXXXXXXXX') {
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(gaScript);

      window.gtag('js', new Date());
      window.gtag('config', measurementId, {
        send_page_view: false, // We'll send manually on route changes
      });
    }

    // Load Google Tag Manager
    if (tagManagerId && tagManagerId !== 'GTM-XXXXXXX') {
      const gtmScript = document.createElement('script');
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${tagManagerId}');
      `;
      document.head.appendChild(gtmScript);

      // Add GTM noscript iframe
      const gtmNoScript = document.createElement('noscript');
      gtmNoScript.innerHTML = `
        <iframe src="https://www.googletagmanager.com/ns.html?id=${tagManagerId}"
          height="0" width="0" style="display:none;visibility:hidden"></iframe>
      `;
      document.body.insertBefore(gtmNoScript, document.body.firstChild);
    }
  }, [measurementId, tagManagerId]);

  // Track page views on route change
  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location]);

  return null;
};

// Helper function to track custom events
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Helper function to track donation events
export const trackDonation = (
  campaignId: string,
  amount: number,
  currency: string = 'NGN'
) => {
  trackEvent('donate', {
    campaign_id: campaignId,
    value: amount,
    currency,
  });
};

// Helper function to track campaign creation
export const trackCampaignCreated = (
  campaignId: string,
  category: string
) => {
  trackEvent('campaign_created', {
    campaign_id: campaignId,
    category,
  });
};
