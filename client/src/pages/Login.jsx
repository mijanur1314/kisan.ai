import { useState } from "react";
import { setAuth } from "../utils/auth";
import { API_BASE } from "../utils/api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.email || !form.password || loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Login failed");
        setLoading(false);
        return;
      }

      setAuth(data);
      window.location.href = "/";
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-green-50">
      <div className="w-80 bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

        <input
          placeholder="Email"
          className="border p-2 w-full mb-3 rounded"
          value={form.email}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, email: e.target.value }))
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-3 rounded"
          value={form.password}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, password: e.target.value }))
          }
        />

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="bg-green-600 text-white w-full py-2 rounded disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-center mt-3">
          No account?{" "}
          <a href="/signup" className="text-green-600">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
