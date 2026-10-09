import React, { useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  title: string;
}

interface Donation {
  id: string;
  campaign_id: string;
  campaign_title: string;
  amount: number;
  status: string;
  date: string;
}

export const DonationsPage: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Missing authentication token");
        }

        const api = import.meta.env.VITE_API_URL;

        const [campaignRes, donationRes] = await Promise.all([
          fetch(`${api}/user/campaigns`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${api}/user/donations`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!campaignRes.ok || !donationRes.ok) {
          throw new Error("Failed to load data");
        }

        const campaignsData = await campaignRes.json();
        const donationsData = await donationRes.json();

        setCampaigns(campaignsData);
        setDonations(donationsData);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error loading donations",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredDonations =
    filter === "all"
      ? donations
      : donations.filter((d) => d.campaign_id === filter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="animate-spin h-6 w-6 text-primary mb-2" />
        <span>Loading your donations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <h2 className="text-2xl font-bold">My Donations</h2>

        <Select onValueChange={setFilter} defaultValue="all">
          <SelectTrigger className="w-[250px] mt-3 md:mt-0">
            <SelectValue placeholder="Filter by Campaign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaigns.length > 0 ? (
              campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>No campaigns found</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {filteredDonations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p>No donations found for the selected campaign.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDonations.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.campaign_title}</TableCell>
                <TableCell>₦{d.amount.toLocaleString()}</TableCell>
                <TableCell
                  className={
                    d.status.toLowerCase() === "completed"
                      ? "text-green-600 font-medium"
                      : "text-yellow-600 font-medium"
                  }
                >
                  {d.status}
                </TableCell>
                <TableCell>
                  {new Date(d.date).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
