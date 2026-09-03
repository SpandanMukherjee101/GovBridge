"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch("/applications/applications");
        // Simple client-side aggregation for demo
        const apps = Array.isArray(data) ? data : data.applications || [];
        setStats({
          total: apps.length,
          pending: apps.filter((a: any) => a.status === "SUBMITTED" || a.status === "DRAFT").length,
          approved: apps.filter((a: any) => a.status === "APPROVED").length,
          rejected: apps.filter((a: any) => a.status === "REJECTED").length,
        });
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: "Total Applications", value: stats.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Pending Review", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Action Required", value: stats.rejected, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <ScrollReveal>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.fullName?.split(" ")[0] || user?.email?.split("@")[0]}
            </h1>
            <p className="text-gray-500 mt-1">Here's what's happening with your applications today.</p>
          </div>
          {(user?.role !== "OFFICER" && user?.role !== "ADMIN") && (
            <Link href="/applications/create">
              <Button>New Application</Button>
            </Link>
          )}
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <ScrollReveal key={i} delay={i * 0.1}>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  {loading ? (
                    <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={0.4}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates on your applications</CardDescription>
              </div>
              <Link href="/applications">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10 text-gray-500">
              {loading ? "Loading..." : "No recent activity to display."}
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
