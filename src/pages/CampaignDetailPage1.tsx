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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";
import { SEO, generateCampaignSchema } from "../components/SEO";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const CampaignDetailPage: React.FC = () => {
  const { param } = useParams<{ param: string }>();

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card");
  const [cryptoSettings, setCryptoSettings] = useState<any>(null);
  const { toast } = useToast();

  /* ===========================
      FETCH CRYPTO SETTINGS
  ============================ */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        const data = await res.json();
        setCryptoSettings(data);
      } catch (error) {
        console.error("Failed to load crypto settings:", error);
      }
    };
    fetchSettings();
  }, []);

  /* ===========================
      FETCH CAMPAIGN DETAILS
  ============================ */
  useEffect(() => {
    if (!param) return;

    const isNumeric = /^\d+$/.test(param);
    const endpoint = isNumeric
      ? `${API_BASE}/campaigns/${param}`
      : `${API_BASE}/campaigns/slug/${param}`;

    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const res = await fetch(endpoint);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch campaign (${res.status}): ${text}`);
        }

        const data = await res.json();

        const mapped = {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          creatorName: data.creatorName,
          created_at: data.created_at,
          image_url: data.imageUrl,
          goal_amount: data.goalAmount,
          amount_raised: data.raisedAmount,
          video_url: data.videoUrl || null,
        };

        setCampaign(mapped);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [param]);

  /* ===========================
      HANDLE DONATION
  ============================ */
  const handleDonation = async (paymentRef?: any) => {
    if (!donationAmount || Number(donationAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid donation amount.",
      });
      return;
    }

    if (!donorName || !donorEmail) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide your name and email.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const donationData = {
        campaign_id: campaign.id,
        donor_name: donorName,
        donor_email: donorEmail,
        amount: Number(donationAmount),
        payment_ref: paymentRef?.reference || null,
      };

      const res = await fetch(`${API_BASE}/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donationData),
      });

      if (!res.ok) throw new Error("Failed to submit donation");

      toast({
        title: "Donation successful!",
        description: `Thank you for donating ₦${Number(donationAmount).toLocaleString()}`,
      });

      setDonationAmount("");
      setDonorName("");
      setDonorEmail("");
    } catch (err) {
      console.error("Donation error:", err);
      toast({
        variant: "destructive",
        title: "Donation failed",
        description: "Please try again later.",
      });
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

  const percentage = Math.min(
    (Number(campaign.amount_raised) / Number(campaign.goal_amount)) * 100,
    100
  );
  const remaining =
    Number(campaign.goal_amount) - Number(campaign.amount_raised);

  return (
    <div className="min-h-screen">
      <SEO
        title={`${campaign.title} - Campaign`}
        description={campaign.description?.substring(0, 160)}
        keywords={`${campaign.category}, fundraising, donation, ${campaign.title}`}
        image={campaign.image_url || "/default-campaign.png"}
        url={`https://yourdomain.com/campaign/${campaign.id}`}
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
              <div className="aspect-video relative overflow-hidden bg-muted rounded-lg">
                {campaign.image_url ? (
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-4 left-4">{campaign.category}</Badge>
              </div>
            </LazyLoad>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl md:text-4xl font-bold">{campaign.title}</h1>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>By {campaign.creatorName || "Organizer"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{campaign.total_donations || 0} donations</span>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Story</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap">
                  {campaign.description}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">
                      ₦{Number(campaign.amount_raised).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of ₦{Number(campaign.goal_amount).toLocaleString()}
                    </span>
                  </div>

                  <Progress value={percentage} className="h-3" />

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">
                        {percentage.toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Funded</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        ₦{remaining.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">To Go</div>
                    </div>
                  </div>
                </div>

                {/* DONATION MODAL */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      Donate Now
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Make a Donation</DialogTitle>
                      <DialogDescription>
                        Choose your preferred payment method.
                      </DialogDescription>
                    </DialogHeader>

                    {/* PAYMENT METHOD SELECTOR */}
                    <div className="flex justify-center gap-3 my-4">
                      <Button
                        variant={paymentMethod === "card" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("card")}
                      >
                        💳 Card / Bank
                      </Button>
                      <Button
                        variant={paymentMethod === "crypto" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("crypto")}
                      >
                        ₿ Crypto
                      </Button>
                    </div>

                    {/* INPUT FIELDS */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Donation Amount (₦)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="5000"
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Your Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={donorEmail}
                          onChange={(e) => setDonorEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* 💳 CARD / BANK PAYMENT (Paystack) */}
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
                                toast({
                                  title: "✅ Payment Successful",
                                  description: "Thank you for your donation!",
                                });
                                console.log("Payment success:", ref);
                                await handleDonation(ref);
                              },
                              onClose: () =>
                                toast({
                                  title: "⚠️ Payment Window Closed",
                                  description: "You cancelled the payment before completion.",
                                }),
                              onError: (error: any) => {
                                toast({
                                  title: "❌ Payment Error",
                                  description: error?.message || "Invalid transaction parameters",
                                  variant: "destructive",
                                });
                                console.error("Paystack error:", error);
                              },
                            }}
                          />

                        </div>
                      )}


                    {/* ₿ CRYPTO PAYMENT */}
                    {paymentMethod === "crypto" && (
                      <div className="mt-6 text-center space-y-5">
                        {!cryptoSettings ? (
                          <p className="text-muted-foreground text-sm">
                            Loading crypto settings...
                          </p>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">
                              Send your donation to any of the wallet addresses below.
                            </p>

                            {/* BTC */}
                            {cryptoSettings?.btc_address && (
                              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                                <h4 className="font-semibold mb-2 text-lg">
                                  Bitcoin (BTC)
                                </h4>
                                <div className="bg-gray-100 p-2 rounded text-sm break-all mb-2">
                                  {cryptoSettings.btc_address}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      cryptoSettings.btc_address
                                    );
                                    toast({
                                      title: "Copied!",
                                      description:
                                        "BTC address copied to clipboard ✅",
                                    });
                                  }}
                                >
                                  📋 Copy BTC Address
                                </Button>
                                {cryptoSettings.btc_qr && (
                                  <img
                                    src={cryptoSettings.btc_qr}
                                    alt="BTC QR Code"
                                    className="mx-auto w-32 h-32 mt-3 object-contain rounded-lg border p-1"
                                  />
                                )}
                              </div>
                            )}

                            {/* USDT */}
                            {cryptoSettings?.usdt_address && (
                              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                                <h4 className="font-semibold mb-2 text-lg">
                                  USDT (TRC20)
                                </h4>
                                <div className="bg-gray-100 p-2 rounded text-sm break-all mb-2">
                                  {cryptoSettings.usdt_address}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      cryptoSettings.usdt_address
                                    );
                                    toast({
                                      title: "Copied!",
                                      description:
                                        "USDT address copied to clipboard ✅",
                                    });
                                  }}
                                >
                                  📋 Copy USDT Address
                                </Button>
                                {cryptoSettings.usdt_qr && (
                                  <img
                                    src={cryptoSettings.usdt_qr}
                                    alt="USDT QR Code"
                                    className="mx-auto w-32 h-32 mt-3 object-contain rounded-lg border p-1"
                                  />
                                )}
                              </div>
                            )}

                            {!cryptoSettings?.btc_address &&
                              !cryptoSettings?.usdt_address && (
                                <p className="text-sm text-red-500">
                                  ⚠️ Crypto donation wallets have not been
                                  configured by the admin.
                                </p>
                              )}

                            <Button
                              onClick={() => handleDonation()}
                              disabled={isSubmitting}
                              className="w-full mt-4"
                            >
                              {isSubmitting
                                ? "Processing..."
                                : "I’ve Sent the Payment"}
                            </Button>
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
    </div>
  );
};
