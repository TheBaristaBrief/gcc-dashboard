import { useState } from "react";

const STORAGE_KEY = "gcc_auth_v1";

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1"
  );
  const [input, setInput]   = useState("");
  const [error, setError]   = useState(false);
  const [shake, setShake]   = useState(false);

  if (authed) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === "gccfiscal") {
      localStorage.setItem(STORAGE_KEY, "1");
      setAuthed(true);
    } else {
      setError(true);
      setShake(true);
      setInput("");
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1923] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl">🛢</span>
            <span className="text-white text-xl font-bold tracking-tight">GCC Fiscal Dashboard</span>
          </div>
          <div className="h-0.5 w-12 bg-amber-400 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Hormuz War Impact Model · Confidential</p>
        </div>

        {/* Card */}
        <div className={`bg-white rounded-2xl shadow-2xl p-7 transition-all ${shake ? "animate-pulse" : ""}`}>
          <p className="text-sm text-gray-500 mb-5 text-center">Enter your access password</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false); }}
              placeholder="Password"
              autoFocus
              className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition
                ${error
                  ? "border-red-400 focus:ring-red-300 bg-red-50"
                  : "border-gray-200 focus:ring-gray-300"
                }`}
            />
            {error && (
              <p className="text-red-500 text-xs text-center">
                Incorrect password — please try again
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-[#1A2A4A] hover:bg-[#243a68] text-white rounded-lg py-3 text-sm font-semibold tracking-wide transition-colors"
            >
              Access Dashboard →
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Restricted access · For authorised users only
        </p>
      </div>
    </div>
  );
}
