import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext"; // ✅ FIXED

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const [bvnError, setBvnError] = useState("");
  const [ninError, setNinError] = useState("");

  const { toast } = useToast();
  const { authFetch, updateUser } = useAuth(); // ✅ pull from context

  useEffect(() => {
    authFetch("/api/user/profile")
      .then((res) => res?.json())
      .then((data) => {
        if (data) setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleFileChange = (e: any, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);

    setProfile((prev: any) => ({
      ...prev,
      [field]: file,
      [`${field}Preview`]: preview,
    }));
  };

  const validateFields = () => {
    let valid = true;

    if (!profile.bvn || profile.bvn.length !== 11) {
      setBvnError("BVN must be exactly 11 digits");
      valid = false;
    } else setBvnError("");

    if (!profile.nin || profile.nin.length !== 11) {
      setNinError("NIN must be exactly 11 digits");
      valid = false;
    } else setNinError("");

    return valid;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      toast({
        variant: "destructive",
        title: "Invalid KYC Fields",
        description: "Please correct the errors before saving.",
      });
      return;
    }

    const formData = new FormData();

    Object.keys(profile).forEach((key) => {
      if (key.includes("Preview")) return;
      if (profile[key] instanceof File || typeof profile[key] === "string") {
        formData.append(key, profile[key]);
      }
    });

    const res = await authFetch("/api/user/profile", {
      method: "PUT",
      body: formData,
    });

    if (!res) return;

    if (res.ok) {
      toast({ title: "Profile updated successfully" });

      // 🔥 SAFE REFRESH — no undefined error
      const refresh = await authFetch("/api/user/profile");

      if (refresh && refresh.ok) {
        const updated = await refresh.json();

        // 🔥 Update global AuthContext → updates Dashboard profile photo
        updateUser({ profile_photo: updated.profile_photo });

        // 🔥 Clear file fields + text inputs reset correctly
        setProfile({
          ...updated,
          profilePicture: null,
          profilePicturePreview: null,
          passport: null,
          driver_license: null,
          national_id: null,
          utility_bill: null,
        });
      }

      setBvnError("");
      setNinError("");
    } else {
      toast({ variant: "destructive", title: "Failed to update profile" });
    }
  };

  if (loading) return <p className="p-4 text-center">Loading profile...</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-xl space-y-12"
    >
      <h2 className="text-3xl font-extrabold text-gray-800">Profile Settings</h2>

      {/* PROFILE IMAGE */}
      <section className="p-5 rounded-lg border bg-gray-50 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Profile Photo</h3>

        <div className="flex items-center gap-6">
          <img
            src={
              profile.profilePicturePreview ||
              profile.profile_photo ||
              "/placeholder.jpg"
            }
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover shadow-md"
          />

          <div className="w-full max-w-xs">
            <Label className="font-medium">Upload New Picture</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "profilePicture")}
              className="mt-2"
            />
          </div>
        </div>
      </section>

      {/* BANK ACCOUNT DETAILS */}
      <section className="p-5 rounded-lg border bg-gray-50 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Bank Account Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Bank Name</Label>
            <Input
              value={profile.bank_name || ""}
              onChange={(e) =>
                setProfile({ ...profile, bank_name: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Account Number</Label>
            <Input
              value={profile.account_number || ""}
              onChange={(e) =>
                setProfile({ ...profile, account_number: e.target.value })
              }
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Account Name</Label>
            <Input
              value={profile.account_name || ""}
              onChange={(e) =>
                setProfile({ ...profile, account_name: e.target.value })
              }
            />
          </div>
        </div>
      </section>

      {/* KYC INFORMATION */}
      <section className="p-5 rounded-lg border bg-gray-50 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">KYC Verification</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>BVN</Label>
            <Input
              value={profile.bvn || ""}
              maxLength={11}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setProfile({ ...profile, bvn: v });
                setBvnError(v.length !== 11 ? "BVN must be exactly 11 digits" : "");
              }}
            />
            {bvnError && (
              <div className="mt-1 text-red-600 text-sm font-medium">
                {bvnError}
              </div>
            )}
          </div>

          <div>
            <Label>NIN</Label>
            <Input
              value={profile.nin || ""}
              maxLength={11}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setProfile({ ...profile, nin: v });
                setNinError(v.length !== 11 ? "NIN must be exactly 11 digits" : "");
              }}
            />
            {ninError && (
              <div className="mt-1 text-red-600 text-sm font-medium">
                {ninError}
              </div>
            )}
          </div>
        </div>

        {/* DOCUMENT UPLOADS */}
        <div className="mt-6 space-y-4">
          <Label className="font-medium">KYC Documents</Label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded p-4 shadow-sm bg-white">
              <Label>Passport</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e, "passport")}
              />
            </div>

            <div className="border rounded p-4 shadow-sm bg-white">
              <Label>Driver’s License</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e, "driver_license")}
              />
            </div>

            <div className="border rounded p-4 shadow-sm bg-white">
              <Label>National ID Card</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e, "national_id")}
              />
            </div>

            <div className="border rounded p-4 shadow-sm bg-white">
              <Label>Utility Bill</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e, "utility_bill")}
              />
            </div>
          </div>
        </div>
      </section>

      <div>
        <Button className="w-full py-3 text-lg font-semibold" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </motion.div>
  );
};
