"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, Activity, ServerCrash, Clock } from "lucide-react";

interface Connector {
  id: number;
  name: string;
  type: string;
  base_url: string;
  timeout: number;
  status: string;
  enabled: boolean;
  updated_at: string;
}

export default function AdminPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthStatuses, setHealthStatuses] = useState<Record<number, 'loading' | 'healthy' | 'unhealthy' | null>>({});

  useEffect(() => {
    fetchConnectors();
  }, []);

  const fetchConnectors = async () => {
    try {
      const response = await apiFetch('/interoperability/connectors');
      setConnectors(Array.isArray(response) ? response : response.data || []);
    } catch (err) {
      console.error("Failed to load connectors:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async (id: number) => {
    setHealthStatuses(prev => ({ ...prev, [id]: 'loading' }));
    try {
      const response = await apiFetch(`/interoperability/connectors/${id}/health`);
      const isHealthy = response?.isHealthy === true;
      setHealthStatuses(prev => ({ ...prev, [id]: isHealthy ? 'healthy' : 'unhealthy' }));
    } catch (err) {
      console.error("Health check failed:", err);
      setHealthStatuses(prev => ({ ...prev, [id]: 'unhealthy' }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-500 mt-2">Manage backend interoperability connectors and monitor external system health.</p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {connectors.map((connector, index) => (
          <ScrollReveal key={connector.id} delay={index * 0.1}>
            <Card className="border-t-4 border-t-gov-blue shadow-md flex flex-col h-full">
              <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-gov-blue rounded-lg">
                      <Server className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg font-bold">{connector.name.replace(/_/g, ' ')}</CardTitle>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    connector.enabled 
                      ? "border border-green-200 text-green-700 bg-green-50" 
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {connector.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm font-medium text-gray-900">{connector.type}</p>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Base URL</p>
                  <div className="bg-gray-50 p-2 rounded border border-gray-100 text-sm text-gray-700 font-mono break-all">
                    {connector.base_url}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    Timeout: {connector.timeout}ms
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-gray-50 border-t border-gray-100 p-4">
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {healthStatuses[connector.id] === 'loading' && (
                      <div className="w-4 h-4 border-2 border-gov-blue border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {healthStatuses[connector.id] === 'healthy' && (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                        <Activity className="w-4 h-4" /> Healthy
                      </div>
                    )}
                    {healthStatuses[connector.id] === 'unhealthy' && (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                        <ServerCrash className="w-4 h-4" /> Unreachable
                      </div>
                    )}
                    {!healthStatuses[connector.id] && (
                      <span className="text-sm text-gray-500">Status unknown</span>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={healthStatuses[connector.id] === 'loading'}
                    onClick={() => checkHealth(connector.id)}
                  >
                    Check Health
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </ScrollReveal>
        ))}
      </div>
      
      {connectors.length === 0 && !loading && (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <Server className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Connectors Found</h3>
          <p className="text-gray-500 mt-1">There are currently no interoperability connectors configured in the system.</p>
        </div>
      )}
    </div>
  );
}
