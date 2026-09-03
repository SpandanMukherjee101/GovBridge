import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Building2, ShieldCheck, FileText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gov-gray">
      <header className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-gov-blue" />
          <span className="text-xl font-bold text-gov-blue-dark tracking-tight">
            GovBridge
          </span>
        </div>
        <Link href="/login">
          <Button variant="outline">Sign In</Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
        <ScrollReveal duration={0.8} direction="up">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gov-blue-dark tracking-tight mb-6 max-w-4xl mx-auto">
            Seamless Digital Government Services
          </h1>
        </ScrollReveal>
        
        <ScrollReveal duration={0.8} delay={0.2} direction="up">
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Access secure, interconnected government platforms in one place. GovBridge ensures interoperability across departments to bring you faster approvals and transparent processes.
          </p>
        </ScrollReveal>

        <ScrollReveal duration={0.8} delay={0.4} direction="up">
          <Link href="/login">
            <Button size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg">
              Access Citizen Portal
            </Button>
          </Link>
        </ScrollReveal>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {[
            {
              icon: ShieldCheck,
              title: "Secure Identity",
              desc: "Your data is protected with state-of-the-art encryption and role-based access control.",
            },
            {
              icon: FileText,
              title: "Unified Applications",
              desc: "Submit once, track everywhere. No more duplicate paperwork across departments.",
            },
            {
              icon: Building2,
              title: "Interoperable Systems",
              desc: "Departments talk to each other seamlessly to verify property and tax records instantly.",
            },
          ].map((feature, i) => (
            <ScrollReveal
              key={i}
              duration={0.6}
              delay={0.6 + i * 0.2}
              direction="up"
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left flex flex-col"
            >
              <div className="bg-gov-blue/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-gov-blue" />
              </div>
              <h3 className="text-xl font-bold text-gov-blue-dark mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.desc}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </main>
      
      <footer className="py-8 bg-gov-blue-dark text-white/70 text-center text-sm">
        <p>&copy; 2026 GovBridge Platform. Smart India Hackathon.</p>
      </footer>
    </div>
  );
}
