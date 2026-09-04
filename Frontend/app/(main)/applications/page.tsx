"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Button } from "@/components/ui/button";
import { FileText, Search, Plus, Filter } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const data = await apiFetch("/applications/applications");
        setApplications(Array.isArray(data) ? data : data.applications || []);
      } catch (err) {
        console.error("Failed to load applications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <ScrollReveal>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <p className="text-gray-500 mt-1">Manage and track your government service requests.</p>
          </div>
          {(user?.role !== "OFFICER" && user?.role !== "ADMIN") && (
            <Link href="/applications/create">
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> New Application
              </Button>
            </Link>
          )}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              className="w-full pl-9 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gov-blue/50"
            />
          </div>
          <Button variant="outline" className="gap-2 text-gray-600">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </div>
      </ScrollReveal>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading applications...</div>
        ) : applications.length === 0 ? (
          <ScrollReveal delay={0.2}>
            <Card className="border-dashed border-2 bg-gray-50/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <FileText className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No applications found</h3>
                <p className="text-gray-500 max-w-sm mt-1 mb-6">
                  You haven't submitted any applications yet. Create one to get started.
                </p>
                {(user?.role !== "OFFICER" && user?.role !== "ADMIN") && (
                  <Link href="/applications/create">
                    <Button>Create Application</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        ) : (
          applications.map((app, i) => (
            <ScrollReveal key={app.id || i} delay={0.1 + i * 0.05}>
              <Card className="hover:border-gov-blue/30 transition-colors">
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gov-blue/5 rounded-lg text-gov-blue">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {app.service_name?.replace(/_/g, ' ') || app.service_type?.replace(/_/g, ' ') || `Application #${app.id}`}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Submitted on {new Date(app.created_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0 border-gray-100">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      app.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                      app.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {app.status || 'PENDING'}
                    </span>
                    <Link href={`/applications/${app.id}`}>
                      <Button variant="ghost" size="sm">
                        {(user?.role === "OFFICER" || user?.role === "ADMIN") ? "Review Application" : "View Details"}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))
        )}
      </div>
    </div>
  );
}
