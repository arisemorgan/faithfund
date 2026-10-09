import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { CampaignCard } from '@/components/CampaignCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
interface Campaign {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  goalAmount: number;
  raisedAmount: number;
  category: string;
  status: string;
  creatorName?: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');

  const categories = [
    'all',
    'Medical',
    'Education',
    'Community',
    'Emergency',
    'Church',
    'Mission',
  ];

  useEffect(() => {
    fetchCampaigns();
  }, [category]);

  const fetchCampaigns = async () => {
  setLoading(true);
  try {
    let url = '/api/campaigns';
    if (category !== 'all') {
      url += `?category=${encodeURIComponent(category)}`;
    }

    console.log("🛰️ Fetching campaigns from:", url);

    const res = await fetch(url);
    console.log("📡 Status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Server error:", text);
      throw new Error(`Failed to fetch campaigns (${res.status})`);
    }

    const data = await res.json();
    console.log("✅ Raw data from backend:", data);

    const approved = data.filter((c: Campaign) =>
      ['approved', 'active'].includes(c.status?.toLowerCase())
    );
    console.log("🎯 Approved campaigns:", approved);

    setCampaigns(approved);
  } catch (error) {
    console.error("🚨 Failed to fetch campaigns:", error);
  } finally {
    setLoading(false);
  }
};
  

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Browse Campaigns - FaithFund Connect</title>
        <meta
          name="description"
          content="Explore active fundraising campaigns from NGOs, churches, and individuals. Find causes that matter and make a difference today."
        />
        <meta
          name="keywords"
          content="fundraising campaigns, charity, donate, NGO projects, church fundraising"
        />
      </Helmet>

      <div className="min-h-screen pt-20">
        {/* Header */}
        <section className="gradient-bg py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="gradient-text">Explore Campaigns</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover inspiring causes and support campaigns that matter to you
              </p>
            </motion.div>
          </div>
        </section>

        {/* Search & Filter */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 border-b">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Campaigns Grid */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="glass rounded-2xl h-96 animate-pulse" />
                ))}
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No campaigns found</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCampaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <CampaignCard campaign={campaign} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
