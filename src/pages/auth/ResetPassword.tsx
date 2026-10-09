import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/reset-password/${token}`,
        { password }
      );

      setMsg(res.data.message || "Password reset successfully!");

      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setMsg(err?.response?.data?.error || "Invalid or expired reset link.");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleReset}
        className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>

        {msg && (
          <p className="mb-4 p-2 rounded bg-green-100 text-green-700 text-sm">
            {msg}
          </p>
        )}

        <label className="block mb-2 font-medium">New Password</label>
        <input
          type="password"
          className="w-full border p-3 rounded mb-4 outline-none"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white p-3 rounded-xl hover:bg-green-700"
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
