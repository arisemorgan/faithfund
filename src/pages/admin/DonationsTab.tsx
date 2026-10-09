import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Search, Filter, Save } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../components/ui/select";
import { Button } from "../../components/ui/button";

interface Donation {
  id: number;
  donor_name: string;
  donor_email: string;
  campaign_name: string;
  amount: number;
  created_at: string;
  status: string;
}

const DonationsTab = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState<number>(10);
  const [filtered, setFiltered] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);

  // 🧾 Fetch all donations
  const fetchDonations = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/donations");
      const data = await res.json();
      const sorted = data.sort(
        (a: Donation, b: Donation) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setDonations(sorted);
      setFiltered(sorted.slice(0, limit));
    } catch (err) {
      console.error("Error fetching donations:", err);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  // 🔍 Search + Limit filter
  useEffect(() => {
    let result = donations;

    if (search.trim() !== "") {
      const s = search.toLowerCase();
      result = donations.filter(
        (d) =>
          d.donor_name?.toLowerCase().includes(s) ||
          d.campaign_name?.toLowerCase().includes(s) ||
          d.created_at?.toLowerCase().includes(s)
      );
    }

    setFiltered(result.slice(0, limit));
  }, [search, limit, donations]);

  // 💾 Update donation status
  const updateStatus = async (id: number, status: string) => {
    setLoading(true);
    try {
      await fetch(`http://localhost:5000/api/admin/donations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchDonations();
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Status badge color helper
  const getBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "successful":
        return "bg-green-100 text-green-700 border border-green-300";
      case "failed":
        return "bg-red-100 text-red-700 border border-red-300";
      default:
        return "bg-yellow-100 text-yellow-700 border border-yellow-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Donations</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, campaign, or date"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-64"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min={1}
                placeholder="Limit"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="pl-8 w-24"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.donor_name || "Anonymous"}</TableCell>
                    <TableCell>{d.campaign_name || "N/A"}</TableCell>
                    <TableCell>₦{Number(d.amount).toLocaleString()}</TableCell>
                    <TableCell>
                      {d.created_at
                        ? new Date(d.created_at).toLocaleDateString("en-NG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Invalid Date"}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getBadgeColor(d.status)}>
                          {d.status.toUpperCase()}
                        </Badge>
                        <Select
                          defaultValue={d.status}
                          onValueChange={(value) =>
                            setDonations((prev) =>
                              prev.map((don) =>
                                don.id === d.id ? { ...don, status: value } : don
                              )
                            )
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="successful">Successful</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Button
                        onClick={() => updateStatus(d.id, d.status)}
                        size="sm"
                        disabled={loading}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No donations found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DonationsTab;
