"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function CreateApplicationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingServices, setFetchingServices] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await apiFetch("/applications/services");
        const srvs = Array.isArray(data) ? data : data.data || [];
        setServices(srvs);
        if (srvs.length > 0) setServiceId(srvs[0].id.toString());
      } catch (err) {
        console.error("Failed to load services", err);
        setError("Failed to load available services");
      } finally {
        setFetchingServices(false);
      }
    };
    loadServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create Draft Application
      const draft = await apiFetch("/applications/applications", {
        method: "POST",
        body: JSON.stringify({ serviceId: parseInt(serviceId) }),
      });
      
      const createdApp = draft.application || draft;
      const appId = createdApp.id;

      // 2. Submit Application
      await apiFetch(`/applications/applications/${appId}/submit`, {
        method: "POST",
      });

      // 3. Save mock form data to localStorage for prototype review purposes
      if (typeof window !== 'undefined') {
        const formData = {
          notes,
          applicant_email: user?.email,
          service_type: services.find(s => s.id.toString() === serviceId)?.name || "Unknown",
          submitted_at: new Date().toISOString()
        };
        localStorage.setItem(`applicationData_${appId}`, JSON.stringify(formData));
      }

      // Route to application details immediately
      router.push(`/applications/${appId}`);
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <ScrollReveal>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/services">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Start Application</h1>
            <p className="text-gray-500">Provide the initial details to begin your process</p>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <Card className="border-gov-blue/20 shadow-md">
          <CardHeader className="bg-blue-50/50 border-b border-gray-100">
            <CardTitle>Application Details</CardTitle>
            <CardDescription>
              Submit minimal information here. GovBridge will handle the rest.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            
            <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex gap-4 items-start">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-emerald-900">Secure Government Verification</h4>
                <p className="text-sm text-emerald-700 mt-1">
                  GovBridge will securely verify eligible information from connected government systems after the required authorization. You will not need to manually submit property or tax documents.
                </p>
              </div>
            </div>

            {fetchingServices ? (
              <div className="text-center py-10 text-gray-500 animate-pulse">Loading services...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Service Type</label>
                  <div className="relative">
                    <select 
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      className="w-full h-11 px-3 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gov-blue/50 focus:border-gov-blue appearance-none pr-10"
                      required
                    >
                      {services.map((srv) => (
                        <option key={srv.id} value={srv.id}>
                          {srv.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Additional Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gov-blue/50 focus:border-gov-blue min-h-[120px]"
                    placeholder="Provide any relevant context for your application..."
                  />
                  <p className="text-xs text-gray-500">Only add information if you believe your automated records might be incomplete.</p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <Link href="/services">
                    <Button type="button" variant="outline">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={loading} className="gap-2 bg-gov-blue hover:bg-blue-800">
                    <Send className="w-4 h-4" /> 
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
