import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: object;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'FaithFund Connect - NGO & Church Fundraising Platform',
  description = 'Empower NGOs and churches to launch transparent fundraising campaigns, share stories, accept donations, and engage communities through live church service streaming.',
  keywords = 'fundraising, NGO, church donations, charity, crowdfunding, faith-based fundraising, church services, live streaming',
  image = 'https://faithfund-connect-8ttwkvtv.sites.blink.new/og-image.png',
  url = 'https://faithfund-connect-8ttwkvtv.sites.blink.new',
  type = 'website',
  structuredData,
}) => {
  const fullTitle = title.includes('FaithFund Connect') ? title : `${title} | FaithFund Connect`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

// Structured data generators
export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'CharitableOrganization',
  name: 'FaithFund Connect',
  description: 'NGO and Church fundraising platform enabling transparent campaigns and community engagement',
  url: 'https://faithfund-connect-8ttwkvtv.sites.blink.new',
  logo: 'https://faithfund-connect-8ttwkvtv.sites.blink.new/logo.png',
  sameAs: [
    'https://twitter.com/faithfundconnect',
    'https://facebook.com/faithfundconnect',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'support@faithfund.org',
  },
});

export const generateCampaignSchema = (campaign: {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  imageUrl?: string;
  category: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'DonateAction',
  name: campaign.title,
  description: campaign.description,
  recipient: {
    '@type': 'CharitableOrganization',
    name: campaign.title,
  },
  object: {
    '@type': 'MonetaryAmount',
    currency: 'NGN',
    value: campaign.goalAmount,
  },
  result: {
    '@type': 'MonetaryAmount',
    currency: 'NGN',
    value: campaign.raisedAmount,
  },
  image: campaign.imageUrl,
  url: `https://faithfund-connect-8ttwkvtv.sites.blink.new/campaign/${campaign.id}`,
});

export const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});
