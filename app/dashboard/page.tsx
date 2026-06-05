"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Clock, Users, TrendingUp, TrendingDown,
  Menu, Home, CalendarDays, UserCheck, FileText,
  Settings, BarChart3, Link2, ArrowUpRight, ExternalLink, ChevronDown, Copy, Check, User
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import AIAssistant from "@/components/ai-assistant";

const navigationItems = [
  { name: "Tableau de bord", icon: Home, href: "/dashboard", active: true },
  { name: "Calendrier", icon: CalendarDays, href: "/dashboard/calendar" },
  { name: "Rendez-vous", icon: UserCheck, href: "/dashboard/appointments" },
  { name: "Types de RDV", icon: FileText, href: "/dashboard/appointment-types" },
  { name: "Disponibilités", icon: Clock, href: "/dashboard/availability" },
  { name: "Profil", icon: User, href: "/dashboard/profile" },
];

function getStatBg(color: string) {
  switch (color) {
    case "blue": return "bg-blue-100 text-blue-600";
    case "green": return "bg-green-100 text-green-600";
    case "red": return "bg-red-100 text-red-600";
    case "purple": return "bg-purple-100 text-purple-600";
    default: return "bg-gray-100 text-gray-600";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "confirmed": return "bg-green-100 text-green-800";
    case "cancelled": return "bg-red-100 text-red-800";
    default: return "bg-yellow-100 text-yellow-800";
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ todayCount: 0, monthCount: 0 });
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/dashboard/stats")
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setStats(data.stats);
            setTodayBookings(data.todayBookings || []);
            setUpcomingBookings(data.upcomingBookings || []);
            setUsername(data.username || null);
          }
        })
        .catch(console.error)
        .finally(() => setDataLoading(false));
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return null;

  const formattedDate = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const userName = session.user?.name || "Utilisateur";
  const userEmail = session.user?.email || "";
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  const statsData = [
    { title: "RDV aujourd'hui", value: dataLoading ? "..." : stats.todayCount.toString(), icon: Calendar, color: "blue", trend: "up", change: `${stats.todayCount} total` },
    { title: "RDV ce mois", value: dataLoading ? "..." : stats.monthCount.toString(), icon: Users, color: "green", trend: "up", change: `${stats.monthCount} total` },
    { title: "Taux annulation", value: "—", icon: TrendingDown, color: "red", trend: "up", change: "Ce mois" },
    { title: "Revenus ce mois", value: "—", icon: TrendingUp, color: "purple", trend: "up", change: "Ce mois" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white border-r transition-all duration-300 flex flex-col flex-shrink-0 overflow-hidden`}>
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ml-2">
                RendezPro
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                item.active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t bg-white">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold select-none">
              {userInitials}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              Déconnexion
            </button>
          )}
        </div>
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
                <h1 className="text-2xl font-bold text-gray-900">Bonjour {userName.split(' ')[0]} 👋</h1>
                <p className="text-gray-600 capitalize">{formattedDate}</p>
              </div>
            </div>
            <Link href="/dashboard/appointment-types">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                + Nouveau type de RDV
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-8">
          {/* Booking link banner */}
          {username && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Link2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide">Votre lien de réservation public</p>
                  <p className="text-sm font-semibold text-indigo-800">localhost:3000/{username}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/${username}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copié !" : "Copier"}
                </Button>
                <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700">
                  <a href={`/${username}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" />Ouvrir
                  </a>
                </Button>
              </div>
            </div>
          )}
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsData.map((stat, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStatBg(stat.color)}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center text-sm text-green-600">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      {stat.change}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today's bookings */}
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">RDV aujourd'hui</CardTitle>
                <Link href="/dashboard/appointments">
                  <Button variant="ghost" size="sm">
                    Voir tout <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : todayBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p>Aucun rendez-vous aujourd'hui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayBookings.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium flex-shrink-0">
                              {b.client.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                          <div>
                            <p className="font-medium text-gray-900">{b.client}</p>
                            <p className="text-sm text-gray-500">{b.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{b.time}</p>
                          <Badge className={`text-xs mt-1 ${getStatusBadge(b.status)}`}>
                            {b.status === "confirmed" ? "Confirmé" : b.status === "cancelled" ? "Annulé" : "En attente"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Prochains RDV</CardTitle>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun rendez-vous à venir</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((b: any) => (
                      <div key={b.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900 text-sm">{b.client}</p>
                        <p className="text-xs text-gray-500 mt-1">{b.dateTime}</p>
                        <p className="text-xs text-gray-400">{b.duration} min</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AIAssistant />
    </div>
  );
}
