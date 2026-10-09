import React, { useState } from "react";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/forgot-password`,
        { email }
      );

      setMsg(res.data.message || "If the email exists, a reset link was sent.");
    } catch (err: any) {
      setMsg(err?.response?.data?.error || "Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-center mb-6">
          Forgot Password
        </h2>

        {msg && (
          <p className="mb-4 p-2 rounded bg-blue-100 text-blue-700 text-sm">
            {msg}
          </p>
        )}

        <label className="block mb-2 font-medium">Email Address</label>
        <input
          type="email"
          className="w-full border p-3 rounded mb-4 outline-none"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-xl mt-2 hover:bg-blue-700"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
