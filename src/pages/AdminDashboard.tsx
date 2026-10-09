import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Heart, Users, DollarSign, Clock } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import UsersTab from "./admin/UsersTab";
import CampaignsTab from "./admin/CampaignsTab";
import WithdrawalsTab from "./admin/WithdrawalsTab";
import ChurchChannelsTab from "./admin/ChurchChannelsTab";
import DonationsTab from "./admin/DonationsTab";
import SettingsTab from "./admin/SettingsTab";
import KYCAdminPanel from "./admin/KYCAdminPanel";


export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [donationTrends, setDonationTrends] = useState<any[]>([]);
  const [campaignCategories, setCampaignCategories] = useState<any[]>([]);
  const [year, setYear] = useState<string>("2025");
  const [categoryStatus, setCategoryStatus] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"year" | "range">("year");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const COLORS = ["#4F46E5", "#22C55E", "#F59E0B", "#EF4444", "#14B8A6"];

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const statsRes = await fetch("http://localhost:5000/api/admin/stats");
        const statsData = await statsRes.json();

        // Build donation trend URL dynamically
        let trendUrl = "http://localhost:5000/api/admin/donation_trends";
        if (filterMode === "year") {
          trendUrl += `?year=${year}`;
        } else if (startDate && endDate) {
          trendUrl += `?startDate=${startDate}&endDate=${endDate}`;
        }

        const donationRes = await fetch(trendUrl);
        const donationData = await donationRes.json();

        const categoryRes = await fetch(
          `http://localhost:5000/api/admin/campaign_categories${
            categoryStatus ? `?status=${categoryStatus}` : ""
          }`
        );
        const categoryData = await categoryRes.json();

        setStats(statsData);
        setDonationTrends(donationData);
        setCampaignCategories(categoryData);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, startDate, endDate, filterMode, categoryStatus]);

  if (loading)
    return <p className="text-center py-10">Loading dashboard...</p>;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, campaigns, donations, and analytics in real-time
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Users" value={stats.users} icon={<Users className="text-blue-500" />} />
          <StatCard label="Total Campaigns" value={stats.campaigns} icon={<Heart className="text-primary" />} />
          <StatCard label="Total Raised" value={`₦${Number(stats.raised || 0).toLocaleString()}`} icon={<DollarSign className="text-green-500" />} />
          <StatCard label="Pending Campaigns" value={stats.pending} icon={<Clock className="text-orange-500" />} />
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donation Trends */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>Donation Trends</CardTitle>
                <CardDescription>Monthly donations overview</CardDescription>
              </div>

              {/* Filter Mode Toggle */}
              <div className="flex items-center space-x-2">
                <select
                  className="border rounded-lg px-2 py-1 text-sm"
                  value={filterMode}
                  onChange={(e) =>
                    setFilterMode(e.target.value as "year" | "range")
                  }
                >
                  <option value="year">By Year</option>
                  <option value="range">Custom Range</option>
                </select>
              </div>
            </CardHeader>

            <CardContent>
              {filterMode === "year" ? (
                <div className="mb-4">
                  <label className="text-sm font-medium mr-2">Select Year:</label>
                  <select
                    className="border rounded-lg px-2 py-1 text-sm"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                  </select>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div>
                    <label className="text-sm font-medium mr-2">Start:</label>
                    <input
                      type="date"
                      className="border rounded-lg px-2 py-1 text-sm"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mr-2">End:</label>
                    <input
                      type="date"
                      className="border rounded-lg px-2 py-1 text-sm"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={donationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Campaign Categories */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>Campaign Categories</CardTitle>
                <CardDescription>Distribution by category</CardDescription>
              </div>
              <select
                className="border rounded-lg px-2 py-1 text-sm"
                value={categoryStatus}
                onChange={(e) => setCategoryStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={campaignCategories}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {campaignCategories.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="channels">Church Channels</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="KYC">KYC</TabsTrigger>

          </TabsList>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignsTab />
          </TabsContent>

          <TabsContent value="withdrawals">
            <WithdrawalsTab />
          </TabsContent>

          <TabsContent value="donations">
            <DonationsTab />
          </TabsContent>

          <TabsContent value="channels">
            <ChurchChannelsTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>

          <TabsContent value="KYC">
            <KYCAdminPanel />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

// === Helper Component for Stats Cards ===
const StatCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: any;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="flex justify-between items-center pb-2">
      <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value || 0}</div>
    </CardContent>
  </Card>
);
