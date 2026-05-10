"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, endOfMonth, isSameDay, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import {
  Calendar,
  CalendarDays,
  Clock,
  FileText,
  Home,
  Link2,
  Menu,
  Settings,
  UserCheck,
  BarChart3,
} from "lucide-react";

type Booking = {
  id: string;
  clientNom: string;
  date: string;
  statut: string;
  eventType?: {
    titre?: string;
    duree?: number;
  };
};

const navigationItems = [
  { name: "Tableau de bord", icon: Home, href: "/dashboard" },
  { name: "Calendrier", icon: CalendarDays, href: "/dashboard/calendar", active: true },
  { name: "Rendez-vous", icon: UserCheck, href: "/dashboard/appointments" },
  { name: "Types de RDV", icon: FileText, href: "/dashboard/appointment-types" },
  { name: "Disponibilités", icon: Clock, href: "/dashboard/availability" },
  { name: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { name: "Intégrations", icon: Link2, href: "/dashboard/integrations" },
  { name: "Paramètres", icon: Settings, href: "/dashboard/settings" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!session) return;

    const from = startOfMonth(month).toISOString();
    const to = endOfMonth(month).toISOString();

    setLoading(true);
    fetch(`/api/booking?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, month]);

  const selectedDayBookings = useMemo(() => {
    if (!selectedDate) return [];

    return bookings
      .filter((b) => isSameDay(new Date(b.date), selectedDate))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bookings, selectedDate]);

  const monthConfirmed = bookings.filter((b) => b.statut === "confirmed").length;
  const monthCancelled = bookings.filter((b) => b.statut === "cancelled").length;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r transition-all duration-300 flex flex-col flex-shrink-0`}>
        <div className="p-4 border-b flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RendezPro
            </span>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                "active" in item ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b px-8 py-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
              <p className="text-gray-600">Vue mensuelle et planning quotidien</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">RDV ce mois</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? "..." : bookings.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">Confirmés</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{loading ? "..." : monthConfirmed}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">Annulés</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{loading ? "..." : monthCancelled}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Sélection de date</CardTitle>
              </CardHeader>
              <CardContent>
                <UiCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={month}
                  onMonthChange={setMonth}
                  locale={fr}
                  className="w-full"
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate
                    ? `Planning du ${format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}`
                    : "Planning du jour"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : selectedDayBookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CalendarDays className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p>Aucun rendez-vous sur cette date</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{booking.clientNom}</p>
                          <p className="text-sm text-gray-500">{booking.eventType?.titre || "Type inconnu"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {format(new Date(booking.date), "HH:mm", { locale: fr })}
                          </p>
                          <Badge className={`mt-1 ${getStatusBadge(booking.statut)}`}>
                            {booking.statut === "confirmed"
                              ? "Confirmé"
                              : booking.statut === "cancelled"
                                ? "Annulé"
                                : "En attente"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
