// src/components/admin/WithdrawalsTab.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Mail, Download } from "lucide-react";

interface Withdrawal {
  id: number;
  user_id?: number;
  email?: string;
  amount: number;
  status: string;
  created_at: string;
}

const statusBadge = (s?: string) => {
  switch ((s || "").toLowerCase()) {
    case "approved":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Approved
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
  }
};

const WithdrawalsTab: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const api = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${api}/admin/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setWithdrawals(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Could not load withdrawals",
        description: err?.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateWithdrawalStatus = async (id: number, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`${api}/admin/withdrawals/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Failed to update");
      }

      toast({
        title: `Withdrawal ${status}`,
        description: `User has been notified by email.`,
      });

      // refresh list
      fetchWithdrawals();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err?.message || "Please try again",
      });
    }
  };

  // memoized filtered data (search + status)
  const filteredData = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    return withdrawals.filter((w) => {
      if (statusFilter && w.status !== statusFilter) return false;

      // match email, amount, or status
      const email = (w.email || "").toLowerCase();
      const status = (w.status || "").toLowerCase();
      const amount = String(w.amount || "");

      if (!q) return true;
      return email.includes(q) || status.includes(q) || amount.includes(q);
    });
  }, [withdrawals, search, statusFilter]);

  const columns = useMemo<ColumnDef<Withdrawal>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      {
        accessorKey: "email",
        header: "User Email",
        cell: (info) => info.getValue() || "—",
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: (info) => `₦${Number(info.getValue()).toLocaleString()}`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => statusBadge(info.getValue() as string),
      },
      {
        accessorKey: "created_at",
        header: "Requested",
        cell: (info) =>
          new Date(String(info.getValue())).toLocaleString(),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const original = row.original;
          return (
            <div className="flex gap-2">
              {original.status === "pending" ? (
                <>
                  <button
                    title="Approve"
                    onClick={() => updateWithdrawalStatus(original.id, "approved")}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>

                  <button
                    title="Reject"
                    onClick={() => updateWithdrawalStatus(original.id, "rejected")}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No actions</div>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: { pageIndex: 0, pageSize },
    },
  });

  // Exports
  const exportCSV = () => {
    // use react-csv link (rendered below)
    return <CSVLink data={filteredData} filename={`withdrawals-${Date.now()}.csv`} />;
  };

  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredData.map((w) => ({
        id: w.id,
        email: w.email ?? "",
        amount: w.amount,
        status: w.status,
        requested: new Date(w.created_at).toLocaleString(),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Withdrawals");
    XLSX.writeFile(wb, `withdrawals-${Date.now()}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("FAITH FUND CONNECT", 14, 14);
    doc.setFontSize(12);
    doc.text("Withdrawal Requests Report", 14, 24);

    const rows = filteredData.map((w) => [
      w.id,
      w.email ?? "",
      `₦${Number(w.amount).toLocaleString()}`,
      w.status,
      new Date(w.created_at).toLocaleString(),
    ]);

    autoTable(doc, {
      head: [["ID", "Email", "Amount", "Status", "Requested"]],
      body: rows,
      startY: 32,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [240, 240, 240] },
    });

    doc.save(`withdrawals-${Date.now()}.pdf`);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPageSize(10);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        {/* Left controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by email, amount, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border rounded px-3 py-2"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>

          <button
            onClick={resetFilters}
            className="text-sm px-3 py-2 border rounded hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        {/* Right controls (exports) */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportXLSX}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-800"
            title="Export XLSX"
          >
            <Download className="w-4 h-4" /> XLSX
          </button>

          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-700 text-white rounded hover:bg-emerald-800"
            title="Export PDF"
          >
            <Download className="w-4 h-4" /> PDF
          </button>

          <CSVLink
            data={filteredData}
            filename={`withdrawals-${Date.now()}.csv`}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
          >
            <Download className="w-4 h-4" /> CSV
          </CSVLink>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto divide-y">
            <thead className="bg-gray-50 sticky top-0">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="px-4 py-3 text-left text-sm font-semibold text-slate-700"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : table.getPaginationRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-8 text-center text-slate-500">
                    No withdrawal requests found.
                  </td>
                </tr>
              ) : (
                table.getPaginationRowModel().rows.map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, translateY: 6 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    whileHover={{ scale: 1.005 }}
                    transition={{ duration: 0.18 }}
                    className="even:bg-white odd:bg-slate-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-slate-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-3 mt-4">
        <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>

        <div className="text-sm text-slate-600">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>

        <div className="ml-auto text-sm text-slate-500">
          Showing {table.getPaginationRowModel().rows.length} of {filteredData.length} results
        </div>
      </div>
    </div>
  );
};

export default WithdrawalsTab;
