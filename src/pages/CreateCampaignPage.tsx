import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";

import imageCompression from "browser-image-compression";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";


export default function CreateCampaignPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor));


  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    goalAmount: "",
    images: [] as { preview: string; file?: File; url?: string }[],
    videoUrl: "",
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);


  // ✅ Check user login
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      toast.error("Please sign in to create a campaign");
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

    // ✅ Image upload to backend
    const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);

    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    let updatedImages = [...formData.images];

    for (let file of files) {
      try {
        // ---------- 1. COMPRESS IMAGE ----------
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        const preview = URL.createObjectURL(compressed);

        // ---------- 2. SHOW PREVIEW IMMEDIATELY ----------
        const newImage: { preview: string; file?: File; url?: string } = {
              preview,
              file: compressed,
            };

        updatedImages.push(newImage);

        // ---------- 3. UPLOAD TO BACKEND ----------
        const form = new FormData();
        form.append("file", compressed);

        const res = await fetch(`${backendUrl}/upload`, {
          method: "POST",
          body: form,
        });

        const data = await res.json();

        if (res.ok) {
          newImage.url = data.url; // Save the backend URL
        } else {
          toast.error(data.error || "Upload failed for one image");
        }
      } catch (err) {
        console.error("Upload failed:", err);
        toast.error("Image upload error");
      }
    }

    setFormData((prev) => ({ ...prev, images: updatedImages }));
    setUploading(false);
  };


    const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = formData.images.findIndex((img) => img.preview === active.id);
    const newIndex = formData.images.findIndex((img) => img.preview === over.id);

    const newImages = arrayMove(formData.images, oldIndex, newIndex);
    setFormData((prev) => ({ ...prev, images: newImages }));
  };



  // ✅ Generate slug from title
  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

        // ✅ Submit campaign
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return toast.error("Please sign in to create a campaign");
        if (formData.images.length === 0)
          return toast.error("Please upload at least one image");

        setLoading(true);

        try {
          const slug = generateSlug(formData.title);
          const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

          const res = await fetch(`${backendUrl}/campaigns`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              title: formData.title,
              description: formData.description,
              category: formData.category,
              goalAmount: parseFloat(formData.goalAmount),
              images: formData.images.map((img) => img.url), // ⬅ FIXED
              videoUrl: formData.videoUrl,
              slug,
              userId: user.id,
            }),
          });

          const data = await res.json();

          if (res.ok) {
            toast.success("🎉 Campaign created! Waiting for admin approval.");
            navigate("/dashboard");
          } else {
            toast.error(data.error || "Failed to create campaign");
          }
        } catch (err) {
          console.error("Campaign creation error:", err);
          toast.error("Server error while creating campaign");
        } finally {
          setLoading(false);
        }
      };

  const categories = [
    "Medical",
    "Education",
    "Community",
    "Emergency",
    "Church",
    "Mission",
  ];

  if (!user)
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );

  return (
    <>
      <Helmet>
        <title>Create Campaign - FaithFund Connect</title>
        <meta
          name="description"
          content="Start your fundraising campaign and receive support from our community"
        />
      </Helmet>

      <div className="min-h-screen pt-20 gradient-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass rounded-3xl p-8 md:p-12">
              <h1 className="text-4xl font-bold mb-2">
                <span className="gradient-text">Create Your Campaign</span>
              </h1>
              <p className="text-muted-foreground mb-8">
                Share your story and start receiving support from our community
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Campaign Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Help build a school in rural community"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Goal */}
                <div>
                  <Label htmlFor="goalAmount">Funding Goal ($) *</Label>
                  <Input
                    id="goalAmount"
                    type="number"
                    min="100"
                    step="0.01"
                    value={formData.goalAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, goalAmount: e.target.value })
                    }
                    placeholder="10000"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Campaign Story *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Tell your story and why you need support..."
                    rows={6}
                    required
                  />
                </div>

                          {/* Advanced Image Upload */}
            <div>
              <Label>Campaign Images *</Label>

              {/* DRAG & DROP UPLOAD */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleImageUpload(e.dataTransfer.files);
                }}
                className="mt-3 border-2 border-dashed border-border p-6 rounded-xl text-center cursor-pointer hover:bg-muted/50"
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="upload-input"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />

                <label htmlFor="upload-input" className="cursor-pointer flex flex-col items-center space-y-2">
                  {uploading ? (
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                      <p className="text-xs text-muted-foreground">Multiple images allowed</p>
                    </>
                  )}
                </label>
              </div>

              {/* SORTABLE IMAGE GRID */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={formData.images.map((img) => img.preview)} strategy={verticalListSortingStrategy}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                    {formData.images.map((img, idx) => (
                      <div key={img.preview} id={img.preview} className="relative group">
                        <img
                          src={img.url || img.preview}
                          className="w-full h-40 object-cover rounded-xl border shadow"
                          onClick={() => setSelectedImage(img.url || img.preview)}
                        />

                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* PREVIEW MODAL */}
              {selectedImage && (
                <div
                  className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                  onClick={() => setSelectedImage(null)}
                >
                  <img src={selectedImage} className="max-w-3xl rounded-xl shadow-lg" />
                </div>
              )}
            </div>


                {/* Video (optional) */}
                <div>
                  <Label htmlFor="videoUrl">Video URL (Optional)</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, videoUrl: e.target.value })
                    }
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                {/* Submit */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-secondary text-white"
                    disabled={loading || uploading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Campaign...
                      </>
                    ) : (
                      "Create Campaign"
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Your campaign will be reviewed by our team before going live.
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
