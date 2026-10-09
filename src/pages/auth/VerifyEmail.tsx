import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/verify/${token}`
        );

        setStatus(res.data.message || "Email verified!");
        setTimeout(() => navigate("/login"), 2000);
      } catch (err: any) {
        setStatus(
          err?.response?.data?.error || "Verification link invalid or expired."
        );
      }
      setLoading(false);
    };

    verify();
  }, [token]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>

        {loading ? (
          <p className="text-blue-500 font-medium">Please wait...</p>
        ) : (
          <p className="text-gray-700">{status}</p>
        )}
      </div>
    </div>
  );
}
