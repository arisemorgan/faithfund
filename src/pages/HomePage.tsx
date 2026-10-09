import React from "react";
import { Helmet } from "react-helmet-async";
import { Hero } from "@/components/layout/Hero";
import { FeaturedCampaigns } from "@/components/home/FeaturedCampaigns";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { SEO, generateOrganizationSchema } from '../components/SEO';
//import { Footer } from "@/components/layout/Footer";

export const HomePage: React.FC = () => {
  return (
    <>
      {/* ✅ SEO Meta Tags & Schema */}
      <Helmet>
        <title>
          FaithFund Connect - Empower NGOs & Churches with Seamless Fundraising
        </title>
        <meta
          name="description"
          content="Join thousands of NGOs, churches, and individuals making a difference. Create campaigns, receive donations, and connect through live spiritual services."
        />
        <meta
          name="keywords"
          content="fundraising, NGO, church, donations, charity, spiritual services, live streaming, faith-based giving"
        />
        <meta
          property="og:title"
          content="FaithFund Connect - Empower Change Through Faith & Giving"
        />
        <meta
          property="og:description"
          content="Create campaigns, receive donations, and join live spiritual events. Make a lasting impact today."
        />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "FaithFund Connect",
            description:
              "Platform for NGOs, churches, and individuals to create campaigns and receive donations",
            url: "https://faithfund.live.blink.new",
            logo: "https://faithfund.live.blink.new/logo.png",
            sameAs: [],
          })}
        </script>
      </Helmet>

      {/* ✅ Hero Section */}
      <Hero />

      {/* ✅ Featured Campaigns (fetches from your backend or mock data) */}
      <FeaturedCampaigns />

      {/* ✅ How It Works Section */}
      <HowItWorks />

      {/* ✅ Testimonials Section */}
      <Testimonials />

     
    </>
  );
};
