import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useToast } from '../../hooks/use-toast';

const SettingsTab: React.FC = () => {
  const [btcAddress, setBtcAddress] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");
  const [btcQr, setBtcQr] = useState("");
  const [usdtQr, setUsdtQr] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/settings");
        const data = await res.json();
        if (data) {
          setBtcAddress(data.btc_address || "");
          setBtcQr(data.btc_qr || "");
          setUsdtAddress(data.usdt_address || "");
          setUsdtQr(data.usdt_qr || "");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // Convert uploaded image to Base64
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "btc" | "usdt"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === "btc") setBtcQr(base64);
      else setUsdtQr(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          btc_address: btcAddress,
          btc_qr: btcQr,
          usdt_address: usdtAddress,
          usdt_qr: usdtQr,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: "✅ Settings updated successfully" });
      } else {
        toast({ title: "❌ Failed to update settings", description: data.error });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "❌ Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Crypto Payment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* BTC Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bitcoin (BTC)</h3>
            <div className="space-y-2">
              <Label>BTC Wallet Address</Label>
              <Input
                value={btcAddress}
                onChange={(e) => setBtcAddress(e.target.value)}
                placeholder="Enter BTC address"
              />
            </div>

            <div className="space-y-2">
              <Label>BTC QR Code</Label>
              <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "btc")} />
              {btcQr && (
                <img src={btcQr} alt="BTC QR" className="w-40 h-40 mt-2 border rounded-md" />
              )}
            </div>
          </div>

          {/* USDT Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tether (USDT)</h3>
            <div className="space-y-2">
              <Label>USDT Wallet Address</Label>
              <Input
                value={usdtAddress}
                onChange={(e) => setUsdtAddress(e.target.value)}
                placeholder="Enter USDT address"
              />
            </div>

            <div className="space-y-2">
              <Label>USDT QR Code</Label>
              <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "usdt")} />
              {usdtQr && (
                <img src={usdtQr} alt="USDT QR" className="w-40 h-40 mt-2 border rounded-md" />
              )}
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
