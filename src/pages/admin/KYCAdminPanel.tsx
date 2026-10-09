// KYCAdminPanel.tsx
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
import { Eye, Download, CheckCircle, XCircle } from "lucide-react";

type KycRow = {
  id: number;
  user_id: number;
  user_email?: string;
  user_full_name?: string;
  user_phone?: string;
  profile_photo?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  bvn?: string;
  nin?: string;
  passport_url?: string;
  driver_license_url?: string;
  national_id_url?: string;
  utility_bill_url?: string;
  status?: "pending" | "approved" | "rejected";
  admin_comment?: string;
  created_at?: string;
  updated_at?: string;
};

const API_BASE = "http://localhost:5000/api"; // per your choice A

const statusBadge = (s?: string) => {
  switch ((s || "").toLowerCase()) {
    case "approved":
      return (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
          Approved
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
  }
};

export default function KYCAdminPanel() {
  const [rows, setRows] = useState<KycRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "" | "pending" | "approved" | "rejected"
  >("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [selected, setSelected] = useState<KycRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { toast } = useToast();
  const token = localStorage.getItem("token") || "";

  // Helper to convert backend relative paths -> full URL
  const ensureFullUrl = (u?: string | null) => {
    if (!u) return null;
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    // some backends give paths like /uploads/..., others kyc/... ensure base
    // NOTE: api base already has /api, but uploads are served from server root /uploads
    // backend used /uploads/... paths, so our full url should point to server root, not /api
    // build server origin from API_BASE:
    try {
      const apiUrl = new URL(API_BASE);
      const origin = `${apiUrl.protocol}//${apiUrl.hostname}${apiUrl.port ? `:${apiUrl.port}` : ""}`;
      // if provided path begins with '/uploads', use origin + path
      if (u.startsWith("/")) return `${origin}${u}`;
      return `${origin}/${u}`;
    } catch {
      return u;
    }
  };

  // Fetch KYC submissions
  const fetchKyc = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/kyc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        toast({
          variant: "destructive",
          title: "Unauthorized",
          description: "Please login as an admin.",
        });
        setRows([]);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch KYC submissions");
      const data = await res.json();
      // Normalize fields (ensure full urls for front-end preview)
      const normalized: KycRow[] = (Array.isArray(data) ? data : []).map((r: any) => ({
        ...r,
        profile_photo: r.profile_photo ? ensureFullUrl(r.profile_photo) : r.profile_photo,
        passport_url: r.passport_url ? ensureFullUrl(r.passport_url) : r.passport_url,
        driver_license_url: r.driver_license_url ? ensureFullUrl(r.driver_license_url) : r.driver_license_url,
        national_id_url: r.national_id_url ? ensureFullUrl(r.national_id_url) : r.national_id_url,
        utility_bill_url: r.utility_bill_url ? ensureFullUrl(r.utility_bill_url) : r.utility_bill_url,
      }));
      setRows(normalized);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Unable to load KYC",
        description: err?.message || "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKyc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Approve/Reject single
  const updateStatus = async (id: number, status: "approved" | "rejected", admin_comment = "") => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/kyc/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, admin_comment }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Failed to update status");
      toast({ title: `KYC ${status}`, description: "User has been notified by email." });
      await fetchKyc();
      setSelected(null);
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Update failed", description: err?.message || "" });
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk update (approve/reject)
  const bulkUpdate = async (ids: number[], status: "approved" | "rejected") => {
    if (!ids.length) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/kyc/bulk-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids, status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Bulk update failed");
      toast({ title: `Bulk ${status}`, description: "Updated selected KYC submissions." });
      await fetchKyc();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Bulk update failed", description: err?.message || "" });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered (memoized)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (r.user_email || "").toLowerCase().includes(q) ||
        (r.user_full_name || "").toLowerCase().includes(q) ||
        (String(r.account_number || "")).includes(q) ||
        (String(r.bvn || "")).includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  // Table columns
  const columns = useMemo<ColumnDef<KycRow>[]>(() => [
    { accessorKey: "id", header: "ID" },
    {
      accessorKey: "user_full_name",
      header: "Name",
      cell: (info) => info.getValue() || info.row.original.user_email || "—",
    },
    { accessorKey: "user_email", header: "Email" },
    {
      accessorKey: "bank_name",
      header: "Bank / Account",
      cell: (info) => {
        const r = info.row.original;
        return r.account_number ? `${r.bank_name || "—"} • ${r.account_number}` : (r.bank_name || "—");
      },
    },
    { accessorKey: "bvn", header: "BVN" },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info) => statusBadge(info.getValue() as string),
    },
    {
      accessorKey: "created_at",
      header: "Submitted",
      cell: (info) => (info.getValue() ? new Date(String(info.getValue())).toLocaleString() : "—"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setSelected(r)}>
              <Eye className="w-4 h-4" /> View
            </Button>
            {r.status === "pending" && (
              <>
                <Button size="sm" className="bg-green-600 text-white" onClick={() => updateStatus(r.id, "approved")}>
                  <CheckCircle className="w-4 h-4" /> Approve
                </Button>
                <Button size="sm" className="bg-red-600 text-white" onClick={() => setSelected(r)}>
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ], [updateStatus]);

  // Table instance
  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination: { pageIndex: 0, pageSize } },
  });

  // Keep table pageSize in sync with local pageSize control
  useEffect(() => {
    try {
      // @ts-ignore - v8 method name may vary by exact tanstack version; this is a safe call
      table.setPageSize?.(pageSize);
    } catch {
      // ignore if unavailable — the table still paginates by getPaginationRowModel rows slice
    }
  }, [pageSize, table]);

  // Exports
  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((r) => ({
        id: r.id,
        name: r.user_full_name || "",
        email: r.user_email || "",
        bank: r.bank_name || "",
        account: r.account_number || "",
        bvn: r.bvn || "",
        status: r.status || "",
        submitted: r.created_at || "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "kyc");
    XLSX.writeFile(wb, `kyc-${Date.now()}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("FAITH FUND CONNECT — KYC Submissions", 14, 14);
    const rowsPdf = filtered.map((r) => [
      r.id,
      r.user_full_name || r.user_email || "",
      r.user_email || "",
      r.bank_name || "",
      r.account_number || "",
      r.bvn || "",
      r.status || "",
      r.created_at ? new Date(r.created_at).toLocaleString() : "",
    ]);
    autoTable(doc, {
      head: [["ID", "Name", "Email", "Bank", "Account", "BVN", "Status", "Submitted"]],
      body: rowsPdf,
      startY: 24,
      styles: { fontSize: 9 },
    });
    doc.save(`kyc-${Date.now()}.pdf`);
  };

  // ---------- Modal component with local comment state (fixes typing issue) ----------
  function KycModal({ kyc, onClose }: { kyc: KycRow; onClose: () => void }) {
    const [localComment, setLocalComment] = useState("");
    useEffect(() => {
      setLocalComment(kyc?.admin_comment || "");
    }, [kyc]);

    if (!kyc) return null;

    const renderDocPreview = (url?: string | null, label?: string) => {
      if (!url) return null;
      const lower = url.toLowerCase();
      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(lower) || url.includes("image/");
      const isPdf = /\.pdf$/i.test(lower) || url.includes(".pdf");
      if (isImage) {
        return (
          <div className="p-3 border rounded">
            <div className="text-sm font-medium mb-2">{label}</div>
            <img src={url} alt={label} className="max-h-48 w-full object-contain" />
            <div className="mt-2">
              <a href={url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Open in new tab</a>
            </div>
          </div>
        );
      } else if (isPdf) {
        return (
          <div className="p-3 border rounded">
            <div className="text-sm font-medium mb-2">{label} (PDF)</div>
            <iframe src={url} title={label} className="w-full h-64 border" />
            <div className="mt-2">
              <a href={url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Open PDF in new tab</a>
            </div>
          </div>
        );
      } else {
        // other file types - provide link
        return (
          <div className="p-3 border rounded flex items-center justify-between">
            <div>{label}</div>
            <a href={url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Open</a>
          </div>
        );
      }
    };

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="z-50 bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 overflow-auto max-h-[85vh]">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <img src={kyc.profile_photo || "/placeholder.jpg"} alt="profile" className="w-16 h-16 rounded-full object-cover" />
              <div>
                <div className="font-semibold">{kyc.user_full_name || kyc.user_email}</div>
                <div className="text-sm text-slate-500">{kyc.user_email}</div>
                {kyc.user_phone && <div className="text-sm text-slate-500">Phone: {kyc.user_phone}</div>}
                <div className="mt-1">{statusBadge(kyc.status)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="text-sm px-3 py-2 border rounded" onClick={onClose}>Close</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Bank Details</h4>
              <div className="text-sm"><strong>Bank:</strong> {kyc.bank_name || "—"}</div>
              <div className="text-sm"><strong>Account No:</strong> {kyc.account_number || "—"}</div>
              <div className="text-sm"><strong>Account Name:</strong> {kyc.account_name || "—"}</div>
              <div className="text-sm"><strong>BVN:</strong> {kyc.bvn || "—"}</div>
              <div className="text-sm"><strong>NIN:</strong> {kyc.nin || "—"}</div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Documents</h4>

              <div className="grid grid-cols-1 gap-3">
                {renderDocPreview(kyc.passport_url || null, "Passport")}
                {renderDocPreview(kyc.driver_license_url || null, "Driver's License")}
                {renderDocPreview(kyc.national_id_url || null, "National ID")}
                {renderDocPreview(kyc.utility_bill_url || null, "Utility Bill")}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Admin Comment (optional)</label>
            <textarea value={localComment} onChange={(e) => setLocalComment(e.target.value)} className="w-full border rounded p-2" rows={3} />
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <Button onClick={() => { setSelected(null); onClose(); }}>Close</Button>
            <Button className="bg-red-600 text-white" onClick={() => updateStatus(kyc.id, "rejected", localComment)} disabled={actionLoading}>
              <XCircle className="w-4 h-4" /> Reject
            </Button>
            <Button className="bg-green-600 text-white" onClick={() => updateStatus(kyc.id, "approved", localComment)} disabled={actionLoading}>
              <CheckCircle className="w-4 h-4" /> Approve
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Selection for bulk operations (simple local selection)
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const toggleSelect = (id: number) => {
    setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const clearSelection = () => setSelectedIds([]);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Input placeholder="Search by email, name, account, bvn..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="border p-2 rounded" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="border p-2 rounded" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportXLSX} className="px-3 py-2 bg-slate-700 text-white rounded inline-flex items-center gap-2"><Download className="w-4 h-4"/> XLSX</button>
          <button onClick={exportPDF} className="px-3 py-2 bg-emerald-700 text-white rounded inline-flex items-center gap-2"><Download className="w-4 h-4"/> PDF</button>

          {/* CSV export */}
          <CSVLink data={filtered} filename={`kyc-${Date.now()}.csv`} className="px-3 py-2 bg-blue-700 text-white rounded inline-flex items-center gap-2">
            <Download className="w-4 h-4"/> CSV
          </CSVLink>

          {/* Audit log download */}
          <a
            href={`${API_BASE}/admin/kyc/audit-log`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-indigo-700 text-white rounded inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Audit CSV
          </a>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={(e) => {
                    if (e.target.checked) setSelectedIds(filtered.map(r => r.id)); else clearSelection();
                  }} />
                </th>
                {table.getHeaderGroups().map((hg) =>
                  hg.headers.map((h) => (
                    <th key={h.id} className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length + 2} className="p-6 text-center">Loading...</td></tr>
              ) : table.getPaginationRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length + 2} className="p-6 text-center">No KYC submissions found.</td></tr>
              ) : (
                table.getPaginationRowModel().rows.map((row) => (
                  <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="even:bg-white odd:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <input type="checkbox" checked={selectedIds.includes(row.original.id)} onChange={() => toggleSelect(row.original.id)} />
                    </td>
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

      {/* Bulk actions + pagination */}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex gap-2">
          <Button onClick={() => bulkUpdate(selectedIds, "approved")} disabled={actionLoading || selectedIds.length === 0}>Bulk Approve</Button>
          <Button onClick={() => bulkUpdate(selectedIds, "rejected")} disabled={actionLoading || selectedIds.length === 0} className="bg-red-600 text-white">Bulk Reject</Button>
          <Button onClick={() => { clearSelection(); }}>Clear</Button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
          <div className="text-sm text-slate-600">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</div>
          <div className="ml-4 text-sm text-slate-500">Showing {table.getPaginationRowModel().rows.length} of {filtered.length}</div>
        </div>
      </div>

      {selected && <KycModal kyc={selected} onClose={() => { setSelected(null); }} />}
    </div>
  );
}
