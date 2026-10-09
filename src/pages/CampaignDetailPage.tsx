// src/pages/CampaignDetailPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import LazyLoad from "react-lazyload";
import { Heart, Share2, Calendar, User, DollarSign } from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PaystackButton } from "react-paystack";
import { useAuth } from "@/context/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";
import { SEO, generateCampaignSchema } from "../components/SEO";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Utility: return an embeddable URL for YouTube/Vimeo or null if not detected.
 */
function getEmbedUrl(videoUrl?: string | null) {
  if (!videoUrl) return null;
  const url = videoUrl.trim();

  // youtube.com/watch?v= or youtu.be/ or youtube.com/embed/
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // vimeo.com/video/ID or vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // If already an embed link, return as-is
  if (url.includes("embed")) return url;

  // If direct video file (mp4/webm/ogg), return as-is
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return url;

  return null;
}

export const CampaignDetailPage: React.FC = () => {
  // allow multiple param names (id, slug, param)
  const params = useParams<Record<string, string>>();
  const param = params.id || params.slug || params.param || "";

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // selectedMedia: type=image|video, src=url
  const [selectedMedia, setSelectedMedia] = useState<{ type: "image" | "video"; src: string } | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card");
  const [cryptoSettings, setCryptoSettings] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Like system
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (!res.ok) return;
        const data = await res.json();
        setCryptoSettings(data);
      } catch (err) {
        console.error("Failed to fetch crypto settings:", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!param) return;

    const isNumeric = /^\d+$/.test(param);
    const endpoint = isNumeric ? `${API_BASE}/campaigns/${param}` : `${API_BASE}/campaigns/slug/${param}`;

    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const res = await fetch(endpoint);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch campaign (${res.status}): ${text}`);
        }
        const data = await res.json();

        // Normalize images: accept `images` array, `imagesJson` string, or single-string fallback
        let images: string[] = [];
        if (Array.isArray(data.images)) {
          images = data.images;
        } else if (Array.isArray(data.imagesJson)) {
          images = data.imagesJson;
        } else if (typeof data.imagesJson === "string" && data.imagesJson.trim()) {
          try {
            const parsed = JSON.parse(data.imagesJson);
            if (Array.isArray(parsed)) images = parsed;
          } catch (e) {
            // ignore parse error
            images = [];
          }
        } else if (typeof data.images === "string" && data.images.trim()) {
          try {
            const parsed = JSON.parse(data.images);
            if (Array.isArray(parsed)) images = parsed;
            else images = [data.images];
          } catch {
            images = [data.images];
          }
        }

        const mapped = {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          creatorName: data.creatorName || data.creator_name || null,
          created_at: data.created_at,
          image_url: data.imageUrl || data.image_url || (images[0] ?? null),
          images,
          goal_amount: Number(data.goalAmount ?? data.goal_amount ?? 0),
          amount_raised: Number(data.raisedAmount ?? data.amount_raised ?? 0),
          video_url: data.videoUrl || data.video_url || null,
          likes: Number(data.likes ?? 0),
        };

        setCampaign(mapped);
        setLikes(mapped.likes);

        try {
          const likedCampaigns = JSON.parse(localStorage.getItem("likedCampaigns") || "[]");
          if (likedCampaigns.includes(mapped.id)) setHasLiked(true);
        } catch {}
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [param]);

  const handleLike = () => {
    if (hasLiked || !campaign) return;
    setHasLiked(true);
    setLikes((p) => p + 1);

    try {
      const likedCampaigns = JSON.parse(localStorage.getItem("likedCampaigns") || "[]");
      if (!likedCampaigns.includes(campaign.id)) {
        likedCampaigns.push(campaign.id);
        localStorage.setItem("likedCampaigns", JSON.stringify(likedCampaigns));
      }
    } catch {}

    fetch(`${API_BASE}/campaigns/${campaign.id}/like`, { method: "POST" }).catch((err) => console.error("Like error:", err));
    toast({ title: "❤️ Thanks for your support!", description: "You liked this campaign." });
  };

  const handleShare = async () => {
    if (!campaign) return;
    const shareData = {
      title: campaign.title,
      text: campaign.description?.substring(0, 100) + "...",
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: "✅ Shared successfully!", description: "Thanks for spreading the word 🙌" });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "📋 Link copied!", description: "You can now paste and share it anywhere." });
      }
    } catch (err) {
      console.error("Share error:", err);
      toast({ variant: "destructive", title: "Share cancelled", description: "You cancelled or an error occurred." });
    }
  };

  const handleDonation = async (paymentRef?: any) => {
    if (!donationAmount || Number(donationAmount) <= 0) {
      toast({ variant: "destructive", title: "Invalid amount", description: "Please enter a valid donation amount." });
      return;
    }
    if (!donorName || !donorEmail) {
      toast({ variant: "destructive", title: "Missing information", description: "Please provide your name and email." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        campaign_id: campaign.id,
        donor_name: donorName,
        donor_email: donorEmail,
        amount: Number(donationAmount),
        payment_ref: paymentRef?.reference || null,
      };
      if (user?.id) payload.donor_user_id = user.id;

      const res = await fetch(`${API_BASE}/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit donation");

      toast({
        title: "Donation successful!",
        description: `Thank you for donating ₦${Number(donationAmount).toLocaleString()}${data.transaction_ref ? ` | Ref: ${data.transaction_ref}` : ""}`,
      });

      setDonationAmount("");
      setDonorName("");
      setDonorEmail("");
    } catch (err: any) {
      console.error("Donation error:", err);
      toast({ variant: "destructive", title: "Donation failed", description: err.message || "Please try again later." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-4">
        <Heart className="h-16 w-16 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-semibold">Campaign not found</h2>
        <Button asChild>
          <Link to="/">Browse Campaigns</Link>
        </Button>
      </div>
    );
  }

  const percentage = campaign.goal_amount > 0 ? (Number(campaign.amount_raised) / Number(campaign.goal_amount)) * 100 : 0;
  const remaining = Number(campaign.goal_amount) - Number(campaign.amount_raised || 0);
  const embedSrc = getEmbedUrl(campaign.video_url);

  return (
    <div className="min-h-screen">
      <SEO
        title={`${campaign.title} - Campaign`}
        description={campaign.description?.substring(0, 160)}
        keywords={`${campaign.category}, fundraising, donation, ${campaign.title}`}
        image={campaign.image_url || "/default-campaign.png"}
        url={typeof window !== "undefined" ? window.location.href : `https://yourdomain.com/campaign/${campaign.id}`}
        type="article"
        structuredData={generateCampaignSchema({
          id: campaign.id,
          title: campaign.title,
          description: campaign.description,
          goalAmount: Number(campaign.goal_amount),
          raisedAmount: Number(campaign.amount_raised),
          imageUrl: campaign.image_url,
          category: campaign.category,
        })}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-6">
            <LazyLoad height={500} offset={100} once>
              <div className="space-y-4">

                {/* MAIN DISPLAY */}
                
                    <div className="aspect-video bg-muted rounded-xl overflow-hidden relative">
                      {selectedMedia ? (
                        <>
                          {/* IMAGE PREVIEW */}
                          {selectedMedia.type === "image" && (
                            <img
                              src={selectedMedia.src}
                              className="w-full h-full object-contain"
                            />
                          )}

                          {/* VIDEO PREVIEW */}
                          {selectedMedia.type === "video" && getEmbedUrl(selectedMedia.src) && (
                            <iframe
                              src={getEmbedUrl(selectedMedia.src) || ""}
                              className="w-full h-full rounded-xl border-0"
                              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title="Campaign video"
                            />
                          )}

                          {/* CLOSE BUTTON */}
                          <button
                            className="absolute top-3 right-3 bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
                            onClick={() => setSelectedMedia(null)}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        // DEFAULT MAIN IMAGE (NO VIDEO HERE)
                        <img
                          src={campaign.images?.[0] || campaign.image_url}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() =>
                            setSelectedMedia({
                              type: "image",
                              src: campaign.images?.[0] || campaign.image_url,
                            })
                          }
                        />
                      )}
                    </div>

              {/* THUMBNAIL SLIDER */}
              <div className="flex gap-3 overflow-x-auto py-1 scrollbar-thin">
                {/* IMAGES */}
                {campaign.images?.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    className="w-24 h-24 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition"
                    onClick={() => setSelectedMedia({ type: "image", src: img })}
                  />
                ))}

                {/* VIDEO BUTTON (NO PREVIEW) */}
                {campaign.video_url && (
                  <div
                    className="w-24 h-24 bg-black text-white flex items-center justify-center rounded-lg cursor-pointer hover:opacity-80 transition text-2xl"
                    onClick={() =>
                      setSelectedMedia({ type: "video", src: campaign.video_url })
                    }
                  >
                    🎥
                  </div>
                )}
              </div>

              </div>
            </LazyLoad>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl md:text-4xl font-bold">{campaign.title}</h1>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button variant={hasLiked ? "default" : "outline"} size="icon" onClick={handleLike}>
                      <Heart className={`h-4 w-4 ${hasLiked ? "text-red-500 fill-red-500" : ""}`} />
                    </Button>
                    <span className="text-sm text-muted-foreground">{likes}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>By {campaign.creatorName || "Organizer"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{0} donations</span>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Story</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap">{campaign.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">₦{Number(campaign.amount_raised).toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">of ₦{Number(campaign.goal_amount).toLocaleString()}</span>
                  </div>

                  <Progress value={percentage} className="h-3" />

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{percentage.toFixed(0)}%</div>
                      <div className="text-xs text-muted-foreground">Funded</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">₦{remaining.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">To Go</div>
                    </div>
                  </div>
                </div>

                {/* DONATION MODAL */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">Donate Now</Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Make a Donation</DialogTitle>
                    </DialogHeader>

                    <div className="flex justify-center gap-3 my-4">
                      <Button variant={paymentMethod === "card" ? "default" : "outline"} onClick={() => setPaymentMethod("card")}>💳 Card / Bank</Button>
                      <Button variant={paymentMethod === "crypto" ? "default" : "outline"} onClick={() => setPaymentMethod("crypto")}>₿ Crypto</Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Donation Amount (₦)</Label>
                        <Input id="amount" type="number" placeholder="5000" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input id="name" type="text" placeholder="John Doe" value={donorName} onChange={(e) => setDonorName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Your Email</Label>
                        <Input id="email" type="email" placeholder="john@example.com" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} />
                      </div>
                    </div>

                    {paymentMethod === "card" && (
                      <div className="mt-6 text-center space-y-5">
                        <PaystackButton
                          className="w-full bg-primary text-white py-2 rounded-md"
                          {...{
                            reference: new Date().getTime().toString(),
                            email: donorEmail || "test@example.com",
                            amount: Number(donationAmount || 0) * 100,
                            publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
                            currency: "NGN",
                            metadata: {
                              custom_fields: [
                                {
                                  display_name: "Donor Name",
                                  variable_name: "donor_name",
                                  value: donorName || "Anonymous",
                                },
                              ],
                            },
                            text: isSubmitting ? "Processing..." : "Pay Now",
                            onSuccess: async (ref: any) => {
                              toast({ title: "✅ Payment Successful", description: "Thank you for your donation!" });
                              await handleDonation(ref);
                            },
                            onClose: () => toast({ title: "⚠️ Payment Window Closed", description: "You cancelled the payment before completion." }),
                            onError: (error: any) => {
                              toast({ variant: "destructive", title: "❌ Payment Error", description: error?.message || "Invalid transaction parameters" });
                              console.error("Paystack error:", error);
                            },
                          }}
                        />
                      </div>
                    )}

                    {paymentMethod === "crypto" && (
                      <div className="mt-6 text-center space-y-5">
                        {!cryptoSettings ? (
                          <p className="text-muted-foreground text-sm">Loading crypto settings...</p>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">Send your donation to any of the wallet addresses below.</p>

                            {cryptoSettings?.btc_address && (
                              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                                <h4 className="font-semibold mb-2 text-lg">Bitcoin (BTC)</h4>
                                <div className="bg-gray-100 p-2 rounded text-sm break-all mb-2">{cryptoSettings.btc_address}</div>
                                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(cryptoSettings.btc_address); toast({ title: "Copied!", description: "BTC address copied to clipboard ✅" }); }}>
                                  📋 Copy BTC Address
                                </Button>
                                {cryptoSettings.btc_qr && <img src={cryptoSettings.btc_qr} alt="BTC QR Code" className="mx-auto w-32 h-32 mt-3 object-contain rounded-lg border p-1" />}
                              </div>
                            )}

                            {cryptoSettings?.usdt_address && (
                              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                                <h4 className="font-semibold mb-2 text-lg">USDT (TRC20)</h4>
                                <div className="bg-gray-100 p-2 rounded text-sm break-all mb-2">{cryptoSettings.usdt_address}</div>
                                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(cryptoSettings.usdt_address); toast({ title: "Copied!", description: "USDT address copied to clipboard ✅" }); }}>
                                  📋 Copy USDT Address
                                </Button>
                                {cryptoSettings.usdt_qr && <img src={cryptoSettings.usdt_qr} alt="USDT QR Code" className="mx-auto w-32 h-32 mt-3 object-contain rounded-lg border p-1" />}
                              </div>
                            )}

                            {!cryptoSettings?.btc_address && !cryptoSettings?.usdt_address && (
                              <p className="text-sm text-red-500">⚠️ Crypto donation wallets have not been configured by the admin.</p>
                            )}

                            <Button onClick={() => handleDonation()} disabled={isSubmitting} className="w-full mt-4">{isSubmitting ? "Processing..." : "I’ve Sent the Payment"}</Button>
                          </>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

     {/* LIGHTBOX PREVIEW */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}  // click outside to close
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}  // prevent inner clicks from closing
          >
            {/* CLOSE BUTTON */}
            <button
              className="absolute -top-4 -right-4 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-xl z-50"
              onClick={() => setSelectedMedia(null)}
            >
              ✕
            </button>

            {/* IMAGE PREVIEW */}
            {selectedMedia.type === "image" && (
              <img
                src={selectedMedia.src}
                className="w-full max-h-[90vh] object-contain rounded-lg"
              />
            )}

            {/* VIDEO PREVIEW */}
            {selectedMedia.type === "video" && getEmbedUrl(selectedMedia.src) && (
              <iframe
                src={getEmbedUrl(selectedMedia.src) || ""}
                className="w-full h-[70vh] rounded-lg border-0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}

            {/* Fallback: raw video file */}
            {selectedMedia.type === "video" && !getEmbedUrl(selectedMedia.src) && (
              <video
                src={selectedMedia.src}
                controls
                className="w-full max-h-[90vh] object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default CampaignDetailPage;
