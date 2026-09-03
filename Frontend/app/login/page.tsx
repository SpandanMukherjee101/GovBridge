"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, KeyRound } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";

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
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gov-gray px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gov-blue-dark skew-y-3 origin-top-left -z-10 opacity-95"></div>
      
      <ScrollReveal duration={0.6} direction="up" className="w-full max-w-md z-10">
        <div className="flex justify-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="bg-white p-4 rounded-full shadow-lg"
          >
            <Building2 className="w-10 h-10 text-gov-blue" />
          </motion.div>
        </div>
        
        <Card className="border-0 shadow-2xl overflow-hidden">
          <div className="bg-gov-blue h-2 w-full"></div>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">GovBridge Login</CardTitle>
            <CardDescription>Enter your credentials to access the portal</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gov-blue/50 focus:border-gov-blue transition-all"
                  placeholder="name@example.com"
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
                    className="w-full h-11 px-3 pl-10 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gov-blue/50 focus:border-gov-blue transition-all"
                    required
                  />
                  <KeyRound className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 text-base mt-2 relative overflow-hidden" 
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Sign In"}
              </Button>
              
              <div className="text-center mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  By logging in, you agree to the Terms of Service for Government Portals.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
