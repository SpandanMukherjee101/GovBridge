"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { FileText, CheckCircle2, Clock, AlertCircle, Shield, Building, Landmark, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeApp, setActiveApp] = useState<any>(null);
  const [pendingConsents, setPendingConsents] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [appTimeline, setAppTimeline] = useState<any[]>([]);
  const [dataRequests, setDataRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch applications
        const appsData = await apiFetch("/applications/applications");
        const apps = Array.isArray(appsData) ? appsData : appsData.applications || [];

        // Find most relevant active application
        const active = apps.find((a: any) => a.status !== "APPROVED" && a.status !== "REJECTED") || apps[0];
        setActiveApp(active);

        if (active) {
          // Fetch timeline for the active app
          try {
            const timelineData = await apiFetch(`/applications/applications/${active.id}/timeline`);
            setAppTimeline(Array.isArray(timelineData) ? timelineData : timelineData.data || []);
          } catch (e) {
            console.error("Timeline fetch error", e);
          }

          // Fetch data requests
          try {
            const drData = await apiFetch(`/interoperability/data-requests?applicationId=${active.id}`);
            setDataRequests(Array.isArray(drData) ? drData : drData.data || []);
          } catch (e) {
            console.error("Data requests fetch error", e);
          }
        }

        // Fetch consents
        if (user?.role === 'CITIZEN') {
          const consentsData = await apiFetch("/interoperability/consents");
          const consents = Array.isArray(consentsData) ? consentsData : consentsData.data || [];
          setPendingConsents(consents.filter((c: any) => c.status === "PENDING"));

          // Generate realistic recent activity based on actual data
          const activities = [];
          if (active) {
            activities.push({ time: new Date(active.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: `Application ${active.id} submitted` });
          }

          const grantedConsents = consents.filter((c: any) => c.status === "ACTIVE");
          if (grantedConsents.length > 0) {
            activities.push({ time: new Date(grantedConsents[0].updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: `Consent granted for ${grantedConsents[0].purpose}` });
          }

          setRecentActivity(activities.reverse().slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  // Derived verification state based on actual backend timeline/status
  const isGovVerificationDone = activeApp?.status === 'UNDER_REVIEW' || activeApp?.status === 'APPROVED' || activeApp?.status === 'REJECTED';
  const isPropertyVerified = isGovVerificationDone || dataRequests.some(dr => dr.target_system === 'PROPERTY_REGISTRY' && dr.status === 'COMPLETED');
  const isTaxVerified = isGovVerificationDone || dataRequests.some(dr => dr.target_system === 'TAX_SYSTEM' && dr.status === 'COMPLETED');
  const isIdentityVerified = !!activeApp; // Identity is implicitly verified upon submission in this system

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Section */}
      <ScrollReveal>
        <div className="bg-gradient-to-r from-gov-blue to-blue-800 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 opacity-10">
            <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          </div>
          <div className="relative z-10 md:w-2/3">
            <h1 className="text-3xl font-bold mb-3">
              Welcome, {user?.fullName?.split(" ")[0] || user?.email?.split("@")[0]}
            </h1>
            <p className="text-blue-100 text-lg mb-6">
              GovBridge lets you submit once and track verification automatically across connected government systems.
            </p>
            {user?.role === "CITIZEN" && (
              <Link href="/services">
                <Button className="bg-white text-gov-blue hover:bg-blue-50 border-0 font-semibold px-6">
                  Discover Services <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Active Application */}
          <ScrollReveal delay={0.1}>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Active Application</h2>
            {loading ? (
              <Card className="h-64 animate-pulse bg-gray-50" />
            ) : activeApp ? (
              <Card className="border-gov-blue/20 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="bg-blue-50/50 border-b border-gray-100 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-gov-blue">
                        {activeApp.service_name?.replace(/_/g, ' ') || activeApp.service_type?.replace(/_/g, ' ') || 'Application'}
                      </CardTitle>
                      <CardDescription className="text-sm font-mono mt-1 text-gray-500">
                        APP-{activeApp.id.toString().padStart(6, '0')}
                      </CardDescription>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-gov-blue text-xs font-semibold rounded-full">
                      {activeApp.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 mb-4">Verification Progress</p>
                    <div className="flex justify-between text-sm mb-2 relative">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -z-10 -translate-y-1/2"></div>

                      {/* Submitted */}
                      <div className="flex flex-col items-center bg-white px-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
                        <span className="text-xs text-gray-600">Submitted</span>
                      </div>

                      {/* Identity */}
                      <div className="flex flex-col items-center bg-white px-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
                        <span className="text-xs text-gray-600">Identity</span>
                      </div>

                      {/* Government System */}
                      <div className="flex flex-col items-center bg-white px-2">
                        {isGovVerificationDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-500 mb-1 animate-pulse" />
                        )}
                        <span className="text-xs text-gray-600">Verification</span>
                      </div>

                      {/* Review */}
                      <div className="flex flex-col items-center bg-white px-2">
                        {activeApp.status === 'APPROVED' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
                        ) : activeApp.status === 'REJECTED' ? (
                          <AlertCircle className="w-5 h-5 text-red-500 mb-1" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-200 mb-1"></div>
                        )}
                        <span className="text-xs text-gray-400">Review</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t border-gray-100">
                  <Link href={`/applications/${activeApp.id}`} className="w-full">
                    <Button variant="ghost" className="w-full text-gov-blue hover:text-blue-800 hover:bg-blue-50">
                      View Application Details <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ) : (
              <Card className="border-dashed border-2 bg-gray-50/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium mb-2">No active applications</p>
                  <p className="text-sm text-gray-400 mb-6">Start a new application to see verification tracking in action.</p>
                  <Link href="/services">
                    <Button>Browse Services</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </ScrollReveal>

          {/* Pending Actions */}
          <ScrollReveal delay={0.2}>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Pending Actions</h2>
            {pendingConsents.length > 0 ? (
              <div className="space-y-3">
                {pendingConsents.map(consent => (
                  <Card key={consent.id} className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="font-medium text-amber-900">Consent Request Requires Attention</p>
                          <p className="text-sm text-amber-700">App #{consent.application_id} • {consent.purpose}</p>
                        </div>
                      </div>
                      <Link href="/consents">
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700">Review</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-gray-400" />
                  You're all caught up!
                </CardContent>
              </Card>
            )}
          </ScrollReveal>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">

          {/* Verification Summary */}
          <ScrollReveal delay={0.3}>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Verified Information</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded text-gov-blue"><Shield className="w-4 h-4" /></div>
                      <span className="font-medium text-sm text-gov-blue">Identity Profile</span>
                    </div>
                    {isIdentityVerified ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <span className="text-xs text-gray-400">Pending</span>}
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded text-indigo-600"><Building className="w-4 h-4" /></div>
                      <span className="font-medium text-sm text-gov-blue">Property Records</span>
                    </div>
                    {isPropertyVerified ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : activeApp ? <Clock className="w-5 h-5 text-amber-500" /> : <span className="text-xs text-gray-400">--</span>}
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded text-emerald-600"><Landmark className="w-4 h-4" /></div>
                      <span className="font-medium text-sm text-gov-blue">Tax Clearance</span>
                    </div>
                    {isTaxVerified ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : activeApp ? <Clock className="w-5 h-5 text-amber-500" /> : <span className="text-xs text-gray-400">--</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Recent Activity */}
          <ScrollReveal delay={0.4}>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Recent Activity</h2>
            <Card>
              <CardContent className="p-6">
                {recentActivity.length > 0 ? (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {recentActivity.map((activity, idx) => (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-slate-300 group-[.is-active]:bg-gov-blue text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] pl-4 md:pl-0 md:group-odd:pr-4 md:group-even:pl-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                            <span className="text-sm font-medium text-slate-800">{activity.text}</span>
                          </div>
                          <span className="text-xs text-slate-500">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center">
                    <Activity className="w-8 h-8 text-gray-300 mb-2" />
                    No recent activity
                  </div>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>

        </div>
      </div>
    </div>
  );
}
