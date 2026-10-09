import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CampaignCard } from "@/components/CampaignCard";
import { Button } from "@/components/ui/button";

interface Campaign {
  id: string | number;
  slug?: string;
  title: string;
  description: string;
  imageUrl?: string;
  goalAmount: number;
  raisedAmount: number;
  category: string;
  status: string;
  creatorName?: string;
}

export function FeaturedCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedCampaigns();
  }, []);

  const fetchFeaturedCampaigns = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/campaigns/featured", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Featured campaigns response:", data);

      // Adjust depending on your backend’s format
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.campaigns)
        ? data.campaigns
        : [];

      setCampaigns(list);
    } catch (error) {
      console.error("❌ Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCampaign = (campaign: Campaign) => {
    navigate(`/campaign/${campaign.slug || campaign.id}`);
  };

  if (loading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Campaigns</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl h-96 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const safeCampaigns = campaigns.filter(c => c && c.id && c.title);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Featured Campaigns</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Support these inspiring causes and make a difference today.
          </p>
        </motion.div>

        {safeCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-6">
              No campaigns yet. Be the first to create one!
            </p>
            <Button onClick={() => navigate("/create-campaign")}>
              Start Your Campaign
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {safeCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => handleViewCampaign(campaign)}
                  >
                    <CampaignCard campaign={campaign} />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/campaigns")}
              >
                View All Campaigns
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
