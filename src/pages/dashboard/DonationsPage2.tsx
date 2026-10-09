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
          throw new Error("Missing authentication token. Please log in again.");
        }

        const [campaignRes, donationRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/user/campaigns`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/user/donations`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!campaignRes.ok || !donationRes.ok) {
          const errText =
            campaignRes.status === 401 || donationRes.status === 401
              ? "Unauthorized – please log in again."
              : "Failed to fetch data from API.";
          throw new Error(errText);
        }

        const campaignsData = await campaignRes.json();
        const donationsData = await donationRes.json();

        setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
        setDonations(Array.isArray(donationsData) ? donationsData : []);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error loading donations",
          description: error.message || "Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // ✅ Handle filtering (show all if filter === "all")
  const filteredDonations =
    filter && filter !== "all"
      ? donations.filter((d) => d.campaign_id === filter)
      : donations;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-600">
        <Loader2 className="animate-spin h-6 w-6 text-primary mb-2" />
        <span>Loading your donations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <h2 className="text-2xl font-bold">My Donations</h2>

        {/* ✅ Fixed Select component */}
        <Select onValueChange={setFilter} defaultValue="all">
          <SelectTrigger className="w-[250px] mt-3 md:mt-0">
            <SelectValue placeholder="Filter by Campaign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {Array.isArray(campaigns) && campaigns.length > 0 ? (
              campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                No campaigns found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {filteredDonations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
          <AlertCircle className="w-8 h-8 mb-2 text-gray-400" />
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
                  {new Date(d.date).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
