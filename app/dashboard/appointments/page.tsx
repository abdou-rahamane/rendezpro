"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Download, Calendar, Clock, User, Mail, Phone,
  Video, MapPin, CheckCircle, XCircle, AlertCircle,
  Menu, Home, CalendarDays, UserCheck, FileText, BarChart3, Link2, Settings, Users
} from "lucide-react";

const navigationItems = [
  { name: "Tableau de bord", icon: Home, href: "/dashboard" },
  { name: "Calendrier", icon: CalendarDays, href: "/dashboard/calendar" },
  { name: "Rendez-vous", icon: UserCheck, href: "/dashboard/appointments", active: true },
  { name: "Types de RDV", icon: FileText, href: "/dashboard/appointment-types" },
    { name: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { name: "Intégrations", icon: Link2, href: "/dashboard/integrations" },
  { name: "Profil", icon: Settings, href: "/dashboard/profile" },
];

function statusBadge(statut: string) {
  switch (statut) {
    case "confirmed": return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Confirmé</span>;
    case "cancelled": return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="w-3 h-3" />Annulé</span>;
    default: return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1"><AlertCircle className="w-3 h-3" />En attente</span>;
  }
}

export default function AppointmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/booking")
        .then(r => r.ok ? r.json() : [])
        .then(setBookings)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session]);

  const filtered = bookings.filter(b => {
    const matchSearch = b.clientNom?.toLowerCase().includes(search.toLowerCase()) ||
      b.clientEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.eventType?.titre?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.statut === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id: string, statut: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/booking/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      if (res.ok) {
        setBookings(prev =>
          prev.map(b => (b.id === id ? { ...b, statut } : b))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCSV = () => {
    const rows = [["Client", "Email", "Téléphone", "Type", "Date", "Statut"]];
    filtered.forEach(b => rows.push([
      b.clientNom, b.clientEmail, b.clientTel || "",
      b.eventType?.titre || "", new Date(b.date).toLocaleDateString("fr-FR"), b.statut
    ]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "rendez-vous.csv";
    a.click();
  };

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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mes rendez-vous</h1>
                <p className="text-gray-600">{bookings.length} rendez-vous au total</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" />Exporter
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {search || statusFilter !== "all" ? "Aucun résultat" : "Aucun rendez-vous"}
                </h3>
                <p className="text-gray-500 text-center max-w-sm">
                  {search || statusFilter !== "all"
                    ? "Modifiez vos filtres pour voir plus de résultats."
                    : "Vos clients pourront réserver via votre page publique."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map(b => (
                <Card key={b.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar className="w-11 h-11">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {b.clientNom?.split(' ').map((n: string) => n[0]).join('') || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-semibold text-gray-900">{b.clientNom}</p>
                            {statusBadge(b.statut)}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{b.clientEmail}</span>
                            {b.clientTel && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{b.clientTel}</span>}
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(b.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(b.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          {b.clientMsg && <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">{b.clientMsg}</p>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-2">
                        <p className="font-medium text-gray-900">{b.eventType?.titre || "—"}</p>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge variant="outline" className={b.eventType?.typeRDV === 'collectif' ? 'border-purple-300 text-purple-700 bg-purple-50' : 'border-blue-300 text-blue-700 bg-blue-50'}>
                            {b.eventType?.typeRDV === 'collectif'
                              ? <><Users className="w-3 h-3 mr-1" />Collectif</>
                              : <><User className="w-3 h-3 mr-1" />Individuel</>}
                          </Badge>
                          {b.eventType?.typeRDV === 'collectif' && b.eventType?.heureFixe && (
                            <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
                              <Clock className="w-3 h-3 mr-1" />{b.eventType.heureFixe}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{b.eventType?.duree || "—"} min · {b.eventType?.prix || 0}€</p>
                        {b.statut !== "cancelled" && (
                          <div className="flex gap-2 justify-end">
                            {b.statut !== "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-300 hover:bg-green-50"
                                disabled={updatingId === b.id}
                                onClick={() => updateStatus(b.id, "confirmed")}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Confirmer
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              disabled={updatingId === b.id}
                              onClick={() => updateStatus(b.id, "cancelled")}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Annuler
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
