import React, { useState, useEffect } from 'react';
import LazyLoad from 'react-lazyload';
import { CampaignCard } from '../components/CampaignCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, Filter, TrendingUp, Heart } from 'lucide-react';
import { SEO, generateOrganizationSchema } from '../components/SEO';

const categories = ['All', 'Education', 'Health', 'Church Project', 'Community'];

export const HomePage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchCampaigns();
  }, [selectedCategory]);

  // ✅ Fetch campaigns from your Express backend
  const fetchCampaigns = async () => {
    try {
      setLoading(true);

      // Build category query string
      let url = "http://localhost:5000/api/campaigns";
      if (selectedCategory !== "All") {
        url += `?category=${encodeURIComponent(selectedCategory)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch campaigns");
      }

      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter campaigns locally for search
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || campaign.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      <SEO
        title="FaithFund Connect - NGO & Church Fundraising Platform"
        description="Empower NGOs and churches to launch transparent fundraising campaigns, share stories, accept donations, and engage communities through live church service streaming."
        keywords="fundraising, NGO, church donations, charity, crowdfunding, faith-based fundraising, church services, live streaming, transparent donations"
        url="https://faithfund-connect.local/"
        structuredData={generateOrganizationSchema()}
      />

      {/* 🌟 Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              <span>Transparent Fundraising Platform</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold">
              Make a Difference Through Faith & Giving
            </h1>
            <p className="text-xl text-muted-foreground">
              Support NGOs and church projects that are transforming communities. 
              Every donation brings hope and creates lasting change.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8">
                Start a Campaign
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Browse Campaigns
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 📊 Stats Section */}
      <section className="py-12 border-b bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">₦50M+</div>
              <div className="text-sm text-muted-foreground">Total Raised</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">1,200+</div>
              <div className="text-sm text-muted-foreground">Active Campaigns</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">25K+</div>
              <div className="text-sm text-muted-foreground">Donors</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">NGOs & Churches</div>
            </div>
          </div>
        </div>
      </section>

      {/* 📦 Campaigns Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* 🔍 Search & Filter */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* 🏷️ Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* 📂 Campaigns Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-[400px] bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCampaigns.map((campaign) => (
                <LazyLoad key={campaign.id} height={400} offset={100} once>
                  <CampaignCard
                    id={campaign.id}
                    title={campaign.title}
                    description={campaign.description}
                    category={campaign.category}
                    goalAmount={Number(campaign.goal_amount)}
                    raisedAmount={Number(campaign.raised_amount || 0)}
                    imageUrl={campaign.image_url}
                    creatorName="Campaign Creator"
                  />
                </LazyLoad>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-2xl font-semibold">No campaigns found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Be the first to create a campaign!'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
