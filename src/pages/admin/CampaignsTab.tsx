import React, { useEffect, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "../../components/ui/dialog";
import { Switch } from "../../components/ui/switch";

/* ===========================
      Campaign Model
=========================== */
interface Campaign {
  id: number;
  title: string;
  category: string;
  creatorName: string;
  status: string;
  featured: number;
  created_at: string;
  description?: string;
  imageUrl?: string;
  imagesJson?: string;
  videoUrl?: string;
}

/* Pagination */
const ITEMS_PER_PAGE = 8;

const CampaignsTab = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filtered, setFiltered] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  /* CONFIRMATION DIALOG */
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string; campaign?: Campaign; }>({ open: false, action: "" });

  /* VIEW MODAL */
  const [viewModal, setViewModal] = useState<{ open: boolean; campaign?: any; }>({ open: false });

  /* EDIT MODAL — (Previously Missing!) */
  const [editModal, setEditModal] = useState<{ open: boolean; campaign?: any; newImages?: File[] }>({
    open: false,
    newImages: []
  });

  /* ===========================
            FETCH CAMPAIGNS
  ============================ */
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/campaigns");
      const data = await res.json();
      setCampaigns(data);
      setFiltered(data);
    } catch (err) {
      console.error("❌ Fetch failed", err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  /* SEARCH / FILTER / SORT */
  useEffect(() => {
    let data = [...campaigns];

    if (search.trim())
      data = data.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

    if (statusFilter !== "all")
      data = data.filter(c => c.status === statusFilter);

    if (sortOrder === "newest")
      data.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    else if (sortOrder === "oldest")
      data.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
    else if (sortOrder === "title")
      data.sort((a, b) => a.title.localeCompare(b.title));

    setFiltered(data);
    setCurrentPage(1);
  }, [search, statusFilter, sortOrder, campaigns]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  /* ===========================
        UPDATE CAMPAIGN STATUS
  ============================ */
  const updateStatus = async (id: number, newStatus: string) => {
    await fetch(`http://localhost:5000/api/campaigns/${id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });

    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  /* Feature Toggle */
  const toggleFeatured = async (c: Campaign) => {
    const featured = c.featured ? 0 : 1;
    await fetch(`http://localhost:5000/api/campaigns/${c.id}/feature`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured })
    });
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, featured } : x));
  };

  /* ===========================
          DELETE IMAGE API
    ============================ */
  const deleteCampaignImage = async (url: string) => {
    await fetch(`http://localhost:5000/api/campaigns/${viewModal.campaign.id}/image`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    fetchCampaigns(); // refresh real data
    openViewCampaign(viewModal.campaign.id);
  };


  /* ===========================
         VIEW CAMPAIGN DETAILS
  ============================ */
  const openViewCampaign = async (id:number)=>{
    const res = await fetch(`http://localhost:5000/api/campaigns/${id}`);
    const data = await res.json();

    if (data.imagesJson) {
      try { data.images = JSON.parse(data.imagesJson); }
      catch { data.images = [data.imagesJson]; }
    } else {
      data.images = data.imageUrl ? [data.imageUrl] : [];
    }

    setViewModal({ open:true, campaign:data });
  };

  /* ===========================
             EDIT FORM
  ============================ */
  const openEditForm = (campaign:any)=>{
    setEditModal({ open:true, campaign, newImages:[] });
  };

  const saveCampaignChanges = async()=>{
    const c = editModal.campaign;

    await fetch(`http://localhost:5000/api/campaigns/${c.id}`,{
      method:"PATCH",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(c)
    });

    /* Upload images if selected */
    if(editModal.newImages && editModal.newImages.length > 0){
      const form = new FormData();
      editModal.newImages.forEach(f=> form.append("images",f));
      await fetch(`http://localhost:5000/api/campaigns/${c.id}/upload`,{
        method:"POST", body: form
      });
    }

    setEditModal({ open:false });
    setViewModal({ open:false });
    fetchCampaigns();
  };

  /* ===========================
                UI
  ============================ */
  return(
    <Card>
      <CardHeader><CardTitle>📋 Manage Campaigns</CardTitle></CardHeader>
      <CardContent>

{/* ---------------- SEARCH & FILTER ---------------- */}
<div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
  <Input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="md:w-1/3"/>
  <div className="flex gap-2">
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="approved">Approved</SelectItem>
        <SelectItem value="archived">Archived</SelectItem>
      </SelectContent>
    </Select>

    <Select value={sortOrder} onValueChange={setSortOrder}>
      <SelectTrigger className="w-[140px]"><SelectValue/></SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="oldest">Oldest</SelectItem>
        <SelectItem value="title">Title (A–Z)</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>

{/* ---------------- TABLE ---------------- */}
{loading ? <p>Loading...</p> : paginatedData.length===0 ? <p>No campaigns</p> :

<div className="overflow-x-auto rounded border">
<table className="min-w-full text-sm">
<thead className="bg-gray-100">
<tr>
  <th className="p-2">Title</th><th className="p-2">Category</th>
  <th className="p-2">Creator</th><th className="p-2">Status</th>
  <th className="p-2">Featured</th><th className="p-2">Created</th>
  <th className="p-2 text-center">Actions</th>
</tr>
</thead>
<tbody>
{paginatedData.map(c=>
<tr key={c.id} className="border-b">
  <td className="p-2">{c.title}</td>
  <td className="p-2">{c.category}</td>
  <td className="p-2">{c.creatorName||"N/A"}</td>
  <td className="p-2"><Badge>{c.status}</Badge></td>
  <td className="p-2"><Switch checked={!!c.featured} onCheckedChange={()=>toggleFeatured(c)}/></td>
  <td className="p-2">{new Date(c.created_at).toLocaleDateString()}</td>

  <td className="text-center space-x-2 p-2">
    <Button size="sm" variant="outline" onClick={()=>openViewCampaign(c.id)}>View</Button>
    {c.status==="pending" && <Button size="sm" onClick={()=>setConfirmDialog({open:true,action:"approve",campaign:c})}>Approve</Button>}
    <Button size="sm" variant="secondary" onClick={()=>setConfirmDialog({open:true,action:"archive",campaign:c})}>Archive</Button>
    <Button size="sm" variant="destructive" onClick={()=>setConfirmDialog({open:true,action:"delete",campaign:c})}>Delete</Button>
  </td>
</tr>
)}
</tbody>
</table>
</div>}

{/* ---------- PAGINATION -------------- */}
{filtered.length>ITEMS_PER_PAGE &&
<div className="flex justify-between mt-3">
  <Button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}>Prev</Button>
  <span>Page {currentPage} / {totalPages}</span>
  <Button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)}>Next</Button>
</div>}

</CardContent>


{/* =====================================================
                 VIEW MODAL (scroll + delete image)
===================================================== */}
<Dialog open={viewModal.open} onOpenChange={(o)=>setViewModal({open:o,campaign:viewModal.campaign})}>
<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
<DialogHeader><DialogTitle>Campaign Preview</DialogTitle></DialogHeader>

{!viewModal.campaign? <p>Loading..</p> :
<div className="space-y-3">

<h2 className="font-bold text-lg">{viewModal.campaign.title}</h2>
<p>{viewModal.campaign.description}</p>

{viewModal.campaign.imageUrl && <img src={viewModal.campaign.imageUrl} className="w-full rounded"/>}

/* gallery */
{viewModal.campaign.images?.length>0 &&
<div className="grid grid-cols-3 gap-3">
{viewModal.campaign.images.map((img,i)=>
<div key={i} className="relative group">
  <img src={img} className="w-full rounded h-20 object-cover"/>
  <button onClick={()=>deleteCampaignImage(img)}
    className="absolute top-1 right-1 bg-red-600 text-white px-2 rounded opacity-0 group-hover:opacity-100">
    ✕
  </button>
</div>
)}
</div>}

{viewModal.campaign.videoUrl &&
<iframe
  src={
    "https://www.youtube-nocookie.com/embed/" +
    viewModal.campaign.videoUrl.split("v=")[1]?.split("&")[0]
  }
  className="w-full h-56 rounded"
  frameBorder="0"
  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
}



<p><b>Status:</b> {viewModal.campaign.status}</p>

<DialogFooter>
  <Button onClick={()=>openEditForm(viewModal.campaign)}>Edit</Button>
  <Button variant="outline" onClick={()=>setViewModal({open:false})}>Close</Button>
</DialogFooter>

</div>}
</DialogContent>
</Dialog>




{/* =====================================================
                EDIT MODAL WITH IMAGE UPLOAD
===================================================== */}
<Dialog open={editModal.open} onOpenChange={(o)=>setEditModal({open:o,campaign:editModal.campaign})}>
<DialogContent className="max-w-lg">
<DialogHeader><DialogTitle>Edit Campaign</DialogTitle></DialogHeader>

{editModal.campaign &&
<div className="space-y-3">

<Input value={editModal.campaign.title}
  onChange={e=>setEditModal(d=>({...d!,campaign:{...d!.campaign,title:e.target.value}}))}/>

<textarea value={editModal.campaign.description}
  onChange={e=>setEditModal(d=>({...d!,campaign:{...d!.campaign,description:e.target.value}}))}
  className="w-full border rounded p-2 h-24"/>

<Input value={editModal.campaign.videoUrl ?? ""} placeholder="Video URL"
  onChange={e=>setEditModal(d=>({...d!,campaign:{...d!.campaign,videoUrl:e.target.value}}))}/>


{/* ---------- IMAGE UPLOAD FIELD ---------- */}
<label className="font-semibold block mt-3">Upload New Images</label>
<input type="file" multiple accept="image/*"
  className="border p-2 rounded w-full"
  onChange={e=>setEditModal(d=>({...d!,newImages:[...Array.from(e.target.files || [])]}))}
/>


<DialogFooter className="pt-3">
  <Button onClick={saveCampaignChanges}>Save</Button>
  <Button variant="outline" onClick={()=>setEditModal({open:false})}>Cancel</Button>
</DialogFooter>

</div>}

</DialogContent>
</Dialog>

</Card>
);
};

export default CampaignsTab;
