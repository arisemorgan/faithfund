import React, { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState("latest");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/users?search=${search}&sort=${sort}&limit=${limit}`
      );
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [search, sort, limit]);

  const updateUserRole = async (id: number, role: string) => {
    await fetch(`http://localhost:5000/api/admin/users/${id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    fetchUsers();
  };

  const toggleVerification = async (id: number, verified: number) => {
    const newStatus = verified ? 0 : 1;
    await fetch(`http://localhost:5000/api/admin/users/${id}/verify`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: newStatus }),
    });
    fetchUsers();
  };

  const toggleUserStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "Suspended" ? "Active" : "Suspended";
    await fetch(`http://localhost:5000/api/admin/users/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchUsers();
  };

  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-60"
        />
        <input
          type="number"
          min={1}
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value) || 1)}
          className="border p-2 rounded w-24"
          title="Number of users to show"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="latest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <Button onClick={fetchUsers} variant="default">Refresh</Button>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <select
                      value={u.role}
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="donor">Donor</option>
                      <option value="creator">Creator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={u.verified ? "default" : "outline"}
                      onClick={() => toggleVerification(u.id, u.verified)}
                    >
                      {u.verified ? "Verified" : "Unverified"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === "Suspended" ? "destructive" : "secondary"}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={u.status === "Suspended" ? "default" : "destructive"}
                      onClick={() => toggleUserStatus(u.id, u.status)}
                    >
                      {u.status === "Suspended" ? "Reactivate" : "Suspend"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default UsersTab;
