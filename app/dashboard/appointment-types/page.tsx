"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Menu, Home, CalendarDays, UserCheck, FileText, BarChart3, Link2, Settings, Plus, Copy, ExternalLink, Video, MapPin, Euro, Pencil, Users, User } from "lucide-react";
import { toast } from "sonner";

const navigationItems = [
  { name: "Tableau de bord", icon: Home, href: "/dashboard" },
  { name: "Calendrier", icon: CalendarDays, href: "/dashboard/calendar" },
  { name: "Rendez-vous", icon: UserCheck, href: "/dashboard/appointments" },
  { name: "Types de RDV", icon: FileText, href: "/dashboard/appointment-types", active: true },
  { name: "Disponibilités", icon: Clock, href: "/dashboard/availability" },
  { name: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { name: "Intégrations", icon: Link2, href: "/dashboard/integrations" },
  { name: "Profil", icon: Settings, href: "/dashboard/profile" },
];

const EMPTY_FORM = { name: "", description: "", duration: "30", price: "0", location: "Visioconférence", typeRDV: "", maxParticipants: "", heureFixe: "" };

export default function AppointmentTypesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (session) loadEventTypes();
  }, [session]);

  const loadEventTypes = () => {
    fetch("/api/event-types")
      .then(r => r.ok ? r.json() : [])
      .then(setEventTypes)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (!form.typeRDV) {
        toast.error("Veuillez sélectionner le type de RDV (individuel ou collectif)");
        setSaving(false);
        return;
      }
      if (form.typeRDV === 'collectif' && (!form.maxParticipants || parseInt(form.maxParticipants) < 2)) {
        toast.error("Un RDV collectif doit avoir au moins 2 participants");
        setSaving(false);
        return;
      }
      const res = await fetch("/api/event-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          duration: parseInt(form.duration),
          price: parseFloat(form.price) || 0,
          location: form.location,
          typeRDV: form.typeRDV,
          maxParticipants: form.typeRDV === 'collectif' ? parseInt(form.maxParticipants) : undefined,
          heureFixe: form.typeRDV === 'collectif' && form.heureFixe ? form.heureFixe : undefined,
        }),
      });
      if (res.ok) {
        toast.success(`Type de RDV ${form.typeRDV} créé !`);
        setForm(EMPTY_FORM);
        setShowForm(false);
        loadEventTypes();
      } else {
        toast.error("Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/booking/${id}`);
    toast.success("Lien copié !");
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Types de RDV</h1>
                <p className="text-gray-600">Configurez les types de rendez-vous que vous proposez</p>
              </div>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />Ajouter un type
            </Button>
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : eventTypes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun type de RDV</h3>
                <p className="text-gray-500 text-center max-w-sm mb-4">
                  Créez votre premier type de rendez-vous pour commencer à recevoir des réservations.
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />Créer un type de RDV
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventTypes.map(et => (
                <Card key={et.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{et.titre}</CardTitle>
                      <Badge variant={et.actif ? "default" : "secondary"}>
                        {et.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {et.description && <p className="text-sm text-gray-600">{et.description}</p>}
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-gray-600"><Clock className="w-4 h-4" />{et.duree} min</span>
                      <span className="flex items-center gap-1 text-gray-600"><Euro className="w-4 h-4" />{et.prix}€</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      {et.lieu?.toLowerCase().includes("visio") ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      {et.lieu}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={et.typeRDV === 'collectif' ? 'border-purple-300 text-purple-700 bg-purple-50' : 'border-blue-300 text-blue-700 bg-blue-50'}>
                        {et.typeRDV === 'collectif' ? <Users className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                        {et.typeRDV === 'collectif' ? `Collectif (max ${et.maxParticipants})` : 'Individuel'}
                      </Badge>
                      {et.typeRDV === 'collectif' && et.heureFixe && (
                        <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
                          <Clock className="w-3 h-3 mr-1" />{et.heureFixe}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-gray-500">{et._count?.bookings || 0} réservation(s)</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => copyLink(et.id)} title="Copier le lien">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" asChild title="Voir la page publique">
                          <a href={`/booking/${et.id}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal ajout */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nouveau type de RDV</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom *</Label>
                  <Input id="name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ex: Séance de coaching" required />
                </div>
                <div>
                  <Label htmlFor="desc">Description</Label>
                  <Input id="desc" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description de ce type de RDV" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Durée</Label>
                    <Select value={form.duration} onValueChange={v => setForm(f => ({...f, duration: v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                        <SelectItem value="120">2 heures</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="price">Prix (€)</Label>
                    <Input id="price" type="number" min="0" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} />
                  </div>
                </div>
                <div>
                  <Label>Lieu</Label>
                  <Select value={form.location} onValueChange={v => setForm(f => ({...f, location: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Visioconférence">Visioconférence</SelectItem>
                      <SelectItem value="Téléphone">Téléphone</SelectItem>
                      <SelectItem value="Cabinet">Cabinet</SelectItem>
                      <SelectItem value="Domicile">Domicile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type de RDV *</Label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({...f, typeRDV: 'individuel', maxParticipants: ''}))}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                        form.typeRDV === 'individuel'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <User className="w-4 h-4" /> Individuel
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({...f, typeRDV: 'collectif'}))}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                        form.typeRDV === 'collectif'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <Users className="w-4 h-4" /> Collectif
                    </button>
                  </div>
                  {!form.typeRDV && <p className="text-xs text-red-500 mt-1">Obligatoire</p>}
                </div>
                {form.typeRDV === 'collectif' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="maxP">Nombre max de participants *</Label>
                      <Input
                        id="maxP"
                        type="number"
                        min="2"
                        max="100"
                        value={form.maxParticipants}
                        onChange={e => setForm(f => ({...f, maxParticipants: e.target.value}))}
                        placeholder="Ex: 10"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="heureFixe">Heure fixe de la séance <span className="text-gray-400 font-normal">(optionnel)</span></Label>
                      <Input
                        id="heureFixe"
                        type="time"
                        value={form.heureFixe}
                        onChange={e => setForm(f => ({...f, heureFixe: e.target.value}))}
                        placeholder="Ex: 19:00"
                      />
                      <p className="text-xs text-gray-500 mt-1">Si remplie, le client ne choisira pas l&apos;heure — elle sera imposée.</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? "Création..." : "Créer"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="flex-1">
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
