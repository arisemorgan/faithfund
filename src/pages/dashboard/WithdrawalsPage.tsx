import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export const WithdrawalsPage: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"amount" | "created_at">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [limit, setLimit] = useState(10);

  const { toast } = useToast();

  const api = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  // Fetch wallet and transactions
  const fetchWallet = async () => {
    try {
      const res = await fetch(`${api}/user/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBalance(data.balance);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Failed to fetch wallet data" });
    }
  };

  // Fetch withdrawals
  const fetchWithdrawals = async () => {
    try {
      const res = await fetch(`${api}/user/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHistory(data || []);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Failed to fetch withdrawals" });
    }
  };

  // Handle withdrawal request
  const handleWithdraw = async () => {
    if (!amount || Number(amount) < 1) {
      return toast({ variant: "destructive", title: "Invalid amount" });
    }

    try {
      const res = await fetch(`${api}/withdrawals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const data = await res.json();
      if (!res.ok) {
        return toast({ variant: "destructive", title: "Withdrawal failed", description: data.error });
      }

      toast({ title: "Withdrawal request sent!" });
      setAmount("");
      fetchWallet();
      fetchWithdrawals();
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Withdrawal failed", description: "Something went wrong" });
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchWithdrawals();
  }, []);

  // Filter, sort, and limit for table
  const filteredHistory = history
    .filter(h =>
      h.amount.toString().includes(search) ||
      h.status.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const fieldA = sortField === "amount" ? a.amount : new Date(a.created_at).getTime();
      const fieldB = sortField === "amount" ? b.amount : new Date(b.created_at).getTime();
      return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
    })
    .slice(0, limit);

  const filteredTransactions = transactions
    .filter(t =>
      t.amount.toString().includes(search) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const fieldA = sortField === "amount" ? a.amount : new Date(a.created_at).getTime();
      const fieldB = sortField === "amount" ? b.amount : new Date(b.created_at).getTime();
      return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
    })
    .slice(0, limit);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Withdraw Funds</h2>

      <div className="text-xl font-semibold">
        Wallet Balance: <span className="text-green-600">₦{balance.toLocaleString()}</span>
      </div>

      <div className="flex gap-3 max-w-md">
        <Input
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button onClick={handleWithdraw}>Request</Button>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search transactions/withdrawals"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sortField} onChange={(e) => setSortField(e.target.value as any)}>
          <option value="created_at">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
        </select>
      </div>

      <h3 className="font-bold text-lg">Wallet Transactions</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTransactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.type}</TableCell>
              <TableCell>₦{Number(t.amount).toLocaleString()}</TableCell>
              <TableCell>{t.description}</TableCell>
              <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h3 className="font-bold text-lg">Withdrawal Requests</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredHistory.map((h) => (
            <TableRow key={h.id}>
              <TableCell>₦{Number(h.amount).toLocaleString()}</TableCell>
              <TableCell>{h.status}</TableCell>
              <TableCell>{new Date(h.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
