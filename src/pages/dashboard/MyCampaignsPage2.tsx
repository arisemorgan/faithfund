import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const MyCampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Missing authentication token.");

        const res = await fetch(`${import.meta.env.VITE_API_URL}/user/campaigns`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errText = res.status === 401 ? "Unauthorized. Please log in again." : "Failed to fetch campaigns.";
          throw new Error(errText);
        }

        const data = await res.json();
        setCampaigns(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error("Error fetching campaigns:", error);
        toast({
          variant: "destructive",
          title: "Error loading campaigns",
          description: error.message || "Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [toast]);

  const filteredCampaigns = campaigns.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-600">
        <Loader2 className="animate-spin h-6 w-6 text-primary mb-2" />
        <span>Loading your campaigns...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Campaigns</h2>
        <Button asChild>
          <Link to="/create-campaign">+ New Campaign</Link>
        </Button>
      </div>

      <Input
        placeholder="Search campaigns..."
        className="max-w-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
          <AlertCircle className="w-8 h-8 mb-2 text-gray-400" />
          <p>No campaigns found.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((c) => (
            <Card key={c.id} className="overflow-hidden shadow-sm hover:shadow-md transition">
              <img
                src={c.imageUrl || "/placeholder.jpg"}
                alt={c.title}
                className="w-full h-40 object-cover"
              />
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  className={
                    c.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                  }
                >
                  {c.status}
                </Badge>

                <p className="text-sm text-muted-foreground mt-2">{c.category}</p>

                <Progress value={(c.raised / c.goal) * 100 || 0} className="mt-3" />

                <div className="flex justify-between text-sm mt-2">
                  <span>₦{(c.raised || 0).toLocaleString()} raised</span>
                  <span>₦{(c.goal || 0).toLocaleString()} goal</span>
                </div>

                <div className="flex justify-between mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/campaign/${c.id}`}>View</Link>
                  </Button>
                  <Button variant="default" size="sm" asChild>
                    <Link to={`/dashboard/campaigns/${c.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
