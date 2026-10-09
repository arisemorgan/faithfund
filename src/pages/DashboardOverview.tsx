import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Heart, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardData {
  stats: {
    activeCampaigns: number;
    totalRaised: number;
    totalDonors: number;
    avgDonation: number;
  };
  recentDonations: {
    donor_name: string;
    campaign_name: string;
    amount: number;
  }[];
  campaignPerformance: {
    name: string;
    progress: number;
  }[];
}

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/user/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        console.log("Dashboard data:", data);
        setData(data);
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p className="text-center text-muted-foreground">Loading dashboard...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  const stats = [
    {
      title: 'Active Campaigns',
      value: data?.stats?.activeCampaigns ?? 0,
      icon: Heart,
      color: 'text-primary',
    },
    {
      title: 'Total Raised',
      value: `₦${(data?.stats?.totalRaised ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-accent',
    },
    {
      title: 'Total Donors',
      value: data?.stats?.totalDonors ?? 0,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Avg. Donation',
      value: `₦${(data?.stats?.avgDonation ?? 0).toFixed(0)}`,
      icon: TrendingUp,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-3xl font-bold">Welcome, {user?.full_name}!</h3>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your campaigns today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recentDonations?.length ? (
                data.recentDonations.map((donation, i) => (
                  <div key={i} className="flex items-center justify-between pb-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{donation.donor_name || 'Anonymous'}</p>
                      <p className="text-sm text-muted-foreground">{donation.campaign_name}</p>
                    </div>
                    <p className="font-semibold text-accent">₦{donation.amount.toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No donations yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.campaignPerformance?.map((campaign, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{campaign.name}</span>
                    <span className="text-muted-foreground">{campaign.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${campaign.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
