"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, KeyRound, User, Shield, Settings } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";

const DEMO_ACCOUNTS = [
  {
    label: "Citizen",
    desc: "Submit applications, grant consent, track journey",
    email: "citizen@govbridge.local",
    password: "password123",
    icon: User,
    color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    label: "Officer",
    desc: "Review applications, approve or reject",
    email: "officer@govbridge.local",
    password: "password123",
    icon: Shield,
    color: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    label: "Admin",
    desc: "Monitor interoperability control centre",
    email: "admin@govbridge.local",
    password: "password123",
    icon: Settings,
    color: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
    iconColor: "text-purple-600",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState("citizen@govbridge.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await login(data.accessToken, data.user);
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gov-gray px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gov-blue-dark skew-y-3 origin-top-left -z-10 opacity-95" />

      <ScrollReveal duration={0.6} direction="up" className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="bg-white p-4 rounded-2xl shadow-lg flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gov-blue rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gov-blue-dark text-lg leading-none">GovBridge</p>
              <p className="text-xs text-gray-400 mt-0.5">SIH Demo Platform</p>
            </div>
          </motion.div>
        </div>

        <Card className="border-0 shadow-2xl overflow-hidden">
          <div className="bg-gov-blue h-1.5 w-full" />
          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="text-2xl font-bold text-gray-900">Sign In</CardTitle>
            <CardDescription className="text-gray-500">Access the GovBridge Demo Platform</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-6 px-6">
            {/* Demo quick-fill */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Demo Accounts — Click to fill</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((acct) => (
                  <button
                    key={acct.label}
                    type="button"
                    onClick={() => {
                      setEmail(acct.email);
                      setPassword(acct.password);
                      setError("");
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${acct.color}`}
                  >
                    <acct.icon className={`w-5 h-5 ${acct.iconColor}`} />
                    {acct.label}
                    <span className="text-[10px] font-normal opacity-70 text-center leading-tight">{acct.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-3 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gov-blue/50 focus:border-gov-blue transition-all text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 px-3 pl-10 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gov-blue/50 focus:border-gov-blue transition-all text-sm"
                      required
                    />
                    <KeyRound className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 text-base mt-1 bg-gov-blue hover:bg-blue-800" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
