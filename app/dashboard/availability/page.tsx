"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Menu, Home, CalendarDays, UserCheck, FileText, BarChart3, Link2, Settings, Save, Copy } from "lucide-react";
import { toast } from "sonner";

const navigationItems = [
  { name: "Tableau de bord", icon: Home, href: "/dashboard" },
  { name: "Calendrier", icon: CalendarDays, href: "/dashboard/calendar" },
  { name: "Rendez-vous", icon: UserCheck, href: "/dashboard/appointments" },
  { name: "Types de RDV", icon: FileText, href: "/dashboard/appointment-types" },
  { name: "Disponibilités", icon: Clock, href: "/dashboard/availability", active: true },
  { name: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { name: "Intégrations", icon: Link2, href: "/dashboard/integrations" },
  { name: "Profil", icon: Settings, href: "/dashboard/profile" },
];

const DAYS = [
  { label: "Lundi", value: 1 },
  { label: "Mardi", value: 2 },
  { label: "Mercredi", value: 3 },
  { label: "Jeudi", value: 4 },
  { label: "Vendredi", value: 5 },
  { label: "Samedi", value: 6 },
  { label: "Dimanche", value: 0 },
];

const TIME_SLOTS = [
  "07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30",
  "19:00","19:30","20:00","20:30","21:00",
];

type DaySchedule = {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
};

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map(d => ({
  dayOfWeek: d.value,
  isActive: d.value >= 1 && d.value <= 5,
  startTime: "09:00",
  endTime: "18:00",
}));

export default function AvailabilityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/availability")
        .then(r => r.ok ? r.json() : [])
        .then((data: any[]) => {
          if (data.length > 0) {
            // Merge existing data with default schedule
            const merged = DEFAULT_SCHEDULE.map(def => {
              const found = data.find(d => d.jour === def.dayOfWeek.toString());
              if (found) {
                return { ...def, isActive: found.actif, startTime: found.heureDebut, endTime: found.heureFin };
              }
              return def;
            });
            setSchedule(merged);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session]);

  const updateDay = (dayOfWeek: number, field: keyof DaySchedule, value: any) => {
    setSchedule(prev => prev.map(d => d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule }),
      });
      if (res.ok) {
        toast.success("Disponibilités sauvegardées !");
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = schedule.filter(d => d.isActive).length;

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!session) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r transition-all duration-300 flex flex-col flex-shrink-0`}>
        <div className="p-4 border-b flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">RendezPro</span>}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${'active' in item ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Disponibilités</h1>
                <p className="text-gray-600">{activeCount} jours actifs configurés</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </div>

        <div className="p-8 max-w-2xl">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Horaires de travail hebdomadaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {DAYS.map(day => {
                  const s = schedule.find(d => d.dayOfWeek === day.value)!;
                  return (
                    <div key={day.value} className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${s.isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                      {/* Toggle */}
                      <Switch
                        checked={s.isActive}
                        onCheckedChange={v => updateDay(day.value, 'isActive', v)}
                      />
                      {/* Day name */}
                      <span className={`w-24 font-medium text-sm ${s.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                        {day.label}
                      </span>
                      {/* Time selects */}
                      {s.isActive ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Select value={s.startTime} onValueChange={v => updateDay(day.value, 'startTime', v)}>
                            <SelectTrigger className="w-28 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <span className="text-gray-500 text-sm">→</span>
                          <Select value={s.endTime} onValueChange={v => updateDay(day.value, 'endTime', v)}>
                            <SelectTrigger className="w-28 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.filter(t => t > s.startTime).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 flex-1">Indisponible</span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <p className="text-sm text-gray-500 mt-4 text-center">
            Ces horaires définissent les créneaux affichés sur votre page de réservation publique.
          </p>
        </div>
      </div>
    </div>
  );
}
