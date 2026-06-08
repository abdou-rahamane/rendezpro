"use client";

import { useState, useEffect } from "react";
import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Menu, Home, CalendarDays, UserCheck, FileText, BarChart3, Link2, Settings, Plus, Copy, ExternalLink, Video, MapPin, Euro, Pencil, Users, User, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

const navigationItems = [
  { name: "Tableau de bord", icon: Home, href: "/dashboard" },
  { name: "Calendrier", icon: CalendarDays, href: "/dashboard/calendar" },
  { name: "Rendez-vous", icon: UserCheck, href: "/dashboard/appointments" },
  { name: "Types de RDV", icon: FileText, href: "/dashboard/appointment-types", active: true },
  { name: "Profil", icon: Settings, href: "/dashboard/profile" },
];

// Interface pour un créneau
interface TimeSlot {
  id?: string
  dateDebut: string  // format "YYYY-MM-DD HH:mm"
  dateFin: string    // format "YYYY-MM-DD HH:mm"
}

const EMPTY_FORM = { 
  name: "", 
  description: "", 
  duration: "30", 
  price: "0", 
  location: "Visioconférence", 
  typeRDV: "", 
  maxParticipants: "", 
  heureFixe: "",
  slots: [] as TimeSlot[]
};

export default function AppointmentTypesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [managingSlots, setManagingSlots] = useState<any | null>(null);
  const [newSlots, setNewSlots] = useState<TimeSlot[]>([]);
  const [savingSlots, setSavingSlots] = useState(false);
  const [slotsManagerMode, setSlotsManagerMode] = useState<'recurring' | 'specific' | 'calendar'>('specific');
  const [modalSlotsManagerMode, setModalSlotsManagerMode] = useState<'recurring' | 'specific' | 'calendar'>('specific');
  
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (session) loadEventTypes();
  }, [session]);

// Composant hybride pour le lieu avec option personnalisée - VERSION SIMPLE
function LocationSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [showCustomInput, setShowCustomInput] = useState(false)

  const presetLocations = [
    'Visioconférence',
    'Téléphone', 
    'Cabinet',
    'Domicile'
  ]

  // Toujours montrer le champ si la valeur n'est pas dans les presets
  const isCustomValue = value && !presetLocations.includes(value)

  return (
    <div className="space-y-3">
      {/* TOUJOURS montrer le Select */}
      <Select value={value || ''} onValueChange={(newValue) => {
        onChange(newValue)
        if (newValue === 'custom') {
          setShowCustomInput(true)
          onChange('')
        } else {
          setShowCustomInput(false)
        }
      }}>
        <SelectTrigger>
          <SelectValue placeholder="Choisissez un lieu..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Visioconférence">📹 Visioconférence</SelectItem>
          <SelectItem value="Téléphone">📞 Téléphone</SelectItem>
          <SelectItem value="Cabinet">🏥 Cabinet</SelectItem>
          <SelectItem value="Domicile">🏠 Domicile</SelectItem>
          <SelectItem value="custom">✏️ Autre lieu (saisir manuellement)</SelectItem>
        </SelectContent>
      </Select>

      {/* TOUJOURS montrer le champ personnalisé si nécessaire */}
      {(showCustomInput || isCustomValue) && (
        <div className="space-y-2 p-4 border-2 border-green-500 rounded-lg bg-green-50">
          <p className="text-sm text-green-700 font-medium">🎯 Champ personnalisé ACTIF !</p>
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ex: Café Le Central, 15 Rue de la Paix, Paris"
            className="w-full border-2 border-green-300"
          />
          <div className="flex gap-2 flex-wrap">
            {[
              'Café', 'Restaurant', 'Parc', 'Bureau', 'Salle de réunion', 
              'Centre commercial', 'Bibliothèque', 'Hotel', 'Co-working'
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onChange(suggestion)}
                className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 rounded transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <p className="text-xs text-green-600">
            💡 Saisissez une adresse précise pour que vos clients puissent vous retrouver facilement
          </p>
        </div>
      )}
    </div>
  )
}

  const loadEventTypes = () => {
    fetch("/api/event-types")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
                setEventTypes(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

// Composant de gestion des créneaux AMÉLIORÉ
function SlotsManager({ slots, onChange, duration, defaultMode, onModeChange }: { 
  slots: TimeSlot[], 
  onChange: (slots: TimeSlot[]) => void,
  duration: number,
  defaultMode?: 'recurring' | 'specific' | 'calendar',
  onModeChange?: (mode: 'recurring' | 'specific' | 'calendar') => void
}) {
  const [mode, setMode_] = useState<'recurring' | 'specific' | 'calendar'>(defaultMode || 'specific')
  const setMode = (m: 'recurring' | 'specific' | 'calendar') => { setMode_(m); onModeChange?.(m); }
  const [recurringPattern, setRecurringPattern] = useState({
    days: [] as string[],
    startTime: '',
    endTime: '',
    startDate: '',
    endDate: ''
  })

  // Mode 1: Créneaux récurrents (le plus simple)
  const generateRecurringSlots = () => {
    const newSlots: TimeSlot[] = []
    const [sy, sm, sd] = recurringPattern.startDate.split('-').map(Number)
    const [ey, em, ed] = recurringPattern.endDate.split('-').map(Number)
    const start = new Date(sy, sm - 1, sd)
    const end = new Date(ey, em - 1, ed)
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const rawDay = date.toLocaleDateString('fr-FR', { weekday: 'long' })
      const dayKey = rawDay.charAt(0).toUpperCase() + rawDay.slice(1)
      if (recurringPattern.days.includes(dayKey)) {
        const slotDate = new Date(date)
        const [startH, startM] = recurringPattern.startTime.split(':').map(Number)
        const [endH, endM] = recurringPattern.endTime.split(':').map(Number)
        
        slotDate.setHours(startH, startM, 0, 0)
        const endDate = new Date(slotDate)
        endDate.setHours(endH, endM, 0, 0)
        
        newSlots.push({
          dateDebut: slotDate.toISOString().slice(0, 16),
          dateFin: endDate.toISOString().slice(0, 16)
        })
      }
    }
    
    onChange([...slots, ...newSlots])
  }

  // Mode 2: Créneaux spécifiques rapides
  const addQuickSlot = (date: string, time: string) => {
    const slotDate = new Date(`${date}T${time}`)
    const endDate = new Date(slotDate)
    endDate.setMinutes(endDate.getMinutes() + duration)
    
    onChange([...slots, {
      dateDebut: slotDate.toISOString().slice(0, 16),
      dateFin: endDate.toISOString().slice(0, 16)
    }])
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Disponibilités pour ce RDV</label>
      
      {/* Sélecteur de mode */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => setMode('recurring')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'recurring' 
              ? 'bg-white text-purple-700 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🔄 Réguliers
        </button>
        <button
          type="button"
          onClick={() => setMode('specific')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'specific' 
              ? 'bg-white text-purple-700 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📅 Spécifiques
        </button>
        <button
          type="button"
          onClick={() => setMode('calendar')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'calendar' 
              ? 'bg-white text-purple-700 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📆 Calendrier
        </button>
      </div>

      {/* Mode 1: Créneaux récurrents */}
      {mode === 'recurring' && (
        <div className="p-4 bg-purple-50 rounded-lg space-y-3">
          <h4 className="font-medium text-purple-900">🔄 Créneaux réguliers</h4>
          
          <div>
            <label className="text-xs text-gray-600">Jours de la semaine</label>
            <div className="grid grid-cols-7 gap-1 mt-1">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => (
                <button
                  key={day}
                  type="button"
                  data-recurring-day={recurringPattern.days.includes(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][i])}
                  data-day={['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][i]}
                  onClick={() => {
                    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
                    const fullDay = days[i]
                    setRecurringPattern(p => ({
                      ...p,
                      days: p.days.includes(fullDay) 
                        ? p.days.filter(d => d !== fullDay)
                        : [...p.days, fullDay]
                    }))
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    recurringPattern.days.includes(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][i])
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">De</label>
              <input
                id="recurringStartTime"
                type="time"
                value={recurringPattern.startTime}
                onChange={e => setRecurringPattern(p => ({ ...p, startTime: e.target.value }))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">À</label>
              <input
                id="recurringEndTime"
                type="time"
                value={recurringPattern.endTime}
                onChange={e => setRecurringPattern(p => ({ ...p, endTime: e.target.value }))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Date de début</label>
              <input
                id="recurringStartDate"
                type="date"
                value={recurringPattern.startDate}
                onChange={e => setRecurringPattern(p => ({ ...p, startDate: e.target.value }))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Date de fin</label>
              <input
                id="recurringEndDate"
                type="date"
                value={recurringPattern.endDate}
                onChange={e => setRecurringPattern(p => ({ ...p, endDate: e.target.value }))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
          
          {/* Bouton pour générer les créneaux - COMME LE MODE SPÉCIFIQUE */}
          <button
            type="button"
            onClick={() => {
              // Validation
              if (!recurringPattern.startDate || !recurringPattern.endDate || !recurringPattern.startTime || !recurringPattern.endTime || recurringPattern.days.length === 0) {
                alert("Veuillez remplir tous les champs et sélectionner au moins un jour")
                return
              }
              
              const newSlots: TimeSlot[] = []
              const [sy, sm, sd] = recurringPattern.startDate.split('-').map(Number)
              const [ey, em, ed] = recurringPattern.endDate.split('-').map(Number)
              const start = new Date(sy, sm - 1, sd)
              const end = new Date(ey, em - 1, ed)
              
              for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                const rawDay = date.toLocaleDateString('fr-FR', { weekday: 'long' })
                const dayKey = rawDay.charAt(0).toUpperCase() + rawDay.slice(1)
                if (recurringPattern.days.includes(dayKey)) {
                  const slotDate = new Date(date)
                  const [startH, startM] = recurringPattern.startTime.split(':').map(Number)
                  const [endH, endM] = recurringPattern.endTime.split(':').map(Number)
                  
                  slotDate.setHours(startH, startM, 0, 0)
                  const endDate = new Date(slotDate)
                  endDate.setHours(endH, endM, 0, 0)
                  
                  newSlots.push({
                    dateDebut: slotDate.toISOString().slice(0, 16),
                    dateFin: endDate.toISOString().slice(0, 16)
                  })
                }
              }
              
              onChange([...slots, ...newSlots])
              
              // Vider les champs du mode régulier après ajout
              setRecurringPattern({
                days: [],
                startTime: '',
                endTime: '',
                startDate: '',
                endDate: ''
              })
            }}
            className="w-full bg-purple-600 text-white px-2 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
          >
            + Ajouter
          </button>
        </div>
      )}

      {/* Mode 2: Créneaux spécifiques */}
      {mode === 'specific' && (
        <div className="p-4 bg-blue-50 rounded-lg space-y-3">
          <h4 className="font-medium text-blue-900">📅 Ajouter des créneaux spécifiques</h4>
          
          <div className="grid grid-cols-3 gap-2">
            <input
              type="date"
              id="specificDate"
              className="px-2 py-1 border rounded text-sm"
              min={new Date().toISOString().split('T')[0]}
            />
            <input
              type="time"
              id="specificTime"
              className="px-2 py-1 border rounded text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const date = (document.getElementById('specificDate') as HTMLInputElement)?.value
                const time = (document.getElementById('specificTime') as HTMLInputElement)?.value
                if (date && time) {
                  const slotDate = new Date(`${date}T${time}`)
                  const endDate = new Date(slotDate)
                  endDate.setMinutes(endDate.getMinutes() + duration)
                  
                  onChange([...slots, {
                    dateDebut: slotDate.toISOString().slice(0, 16),
                    dateFin: endDate.toISOString().slice(0, 16)
                  }]);
                  
                  // Vider les champs après ajout
                  const dateInput = document.getElementById('specificDate') as HTMLInputElement
                  const timeInput = document.getElementById('specificTime') as HTMLInputElement
                  if (dateInput) dateInput.value = ''
                  if (timeInput) timeInput.value = ''
                }
              }}
              className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              + Ajouter
            </button>
          </div>

          <div className="text-xs text-gray-600">
            💡 Astuce : Ajoutez rapidement plusieurs créneaux pour des dates spéciales
          </div>
        </div>
      )}

      {/* Mode 3: Vue calendrier */}
      {mode === 'calendar' && (
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-3">📆 Vue calendrier</h4>
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">🚀 Vue calendrier interactive</p>
            <p className="text-xs mt-1">(Cliquez sur les dates pour ajouter des créneaux)</p>
          </div>
        </div>
      )}

      
      {/* Liste des créneaux existants - TOUJOURS VISIBLE */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          📋 {slots.length} créneau{slots.length > 1 ? 'x' : ''} configuré{slots.length > 1 ? 's' : ''}
        </h4>
        {slots.length === 0 ? (
          <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-sm text-gray-500">Aucun créneau ajouté</p>
            <p className="text-xs text-gray-400 mt-1">Ajoutez des créneaux ci-dessus</p>
          </div>
        ) : (
          <div className="max-h-32 overflow-y-auto space-y-1">
            {slots.map((slot, index) => {
              return (
                <div key={index} className="flex items-center justify-between p-2 rounded text-sm bg-green-50 border border-green-200">
                  <span className="text-green-700 font-medium">
                    📅 {new Date(slot.dateDebut).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })} 
                    {' '}{new Date(slot.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(slots.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Supprimer
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
          </div>
  )
}

  
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
      
      // Vérifier si le mode réguliers est utilisé et générer les créneaux automatiquement
      let finalSlots = [...slots];
      
      // Récupérer les valeurs du mode réguliers depuis le formulaire
      const recurringDays = Array.from(document.querySelectorAll('button[data-recurring-day="true"]')).map(btn => btn.getAttribute('data-day'));
      const startDate = (document.getElementById('recurringStartDate') as HTMLInputElement)?.value;
      const endDate = (document.getElementById('recurringEndDate') as HTMLInputElement)?.value;
      const startTime = (document.getElementById('recurringStartTime') as HTMLInputElement)?.value;
      const endTime = (document.getElementById('recurringEndTime') as HTMLInputElement)?.value;
      
      // Si tous les champs réguliers sont remplis, générer les créneaux
      if (recurringDays.length > 0 && startDate && endDate && startTime && endTime) {
        const newSlots: TimeSlot[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
          if (recurringDays.includes(dayName)) {
            const slotDate = new Date(date);
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);
            
            slotDate.setHours(startH, startM, 0, 0);
            const endDateSlot = new Date(slotDate);
            endDateSlot.setHours(endH, endM, 0, 0);
            
            newSlots.push({
              dateDebut: slotDate.toISOString().slice(0, 16),
              dateFin: endDateSlot.toISOString().slice(0, 16)
            });
          }
        }
        
        finalSlots = [...finalSlots, ...newSlots];
        
        // Debug temporaire pour voir les créneaux générés
        console.log("Créneaux générés automatiquement:", newSlots);
      }
      
      const requestData = {
        name: form.name,
        description: form.description,
        duration: parseInt(form.duration),
        price: parseFloat(form.price) || 0,
        location: form.location,
        typeRDV: form.typeRDV,
        maxParticipants: form.typeRDV === 'collectif' ? parseInt(form.maxParticipants) : undefined,
        heureFixe: form.typeRDV === 'collectif' && form.heureFixe ? form.heureFixe : undefined,
        slots: finalSlots.filter((slot: TimeSlot) => slot.dateDebut && slot.dateFin)
      };
      
            
      const res = await fetch("/api/event-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      
            
      if (res.ok) {
        const data = await res.json();
                toast.success(`Type de RDV ${form.typeRDV} créé !`);
        setForm(EMPTY_FORM);
        setSlots([]);
        setShowForm(false);
        // Forcer le rechargement après un court délai pour laisser le temps à la BDD de se mettre à jour
        setTimeout(() => {
          loadEventTypes();
        }, 500);
      } else {
        const errorData = await res.json();
                toast.error(`Erreur: ${errorData.error || 'Erreur lors de la création'}`);
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const openSlotsModal = (et: any) => {
    setManagingSlots(et);
    setNewSlots([]);
    setModalSlotsManagerMode('specific');
  };

  const handleAddSlots = async () => {
    if (!managingSlots || newSlots.length === 0) return;
    setSavingSlots(true);
    try {
      const res = await fetch(`/api/event-types/${managingSlots.id}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: newSlots }),
      });
      if (res.ok) {
        const data = await res.json();
        setManagingSlots((prev: any) => ({ ...prev, slots: data.slots }));
        setEventTypes(prev => prev.map(et =>
          et.id === managingSlots.id ? { ...et, slots: data.slots } : et
        ));
        setNewSlots([]);
        toast.success(`${newSlots.length} créneau(x) ajouté(s) !`);
      } else {
        toast.error("Erreur lors de l'ajout des créneaux");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSavingSlots(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!managingSlots) return;
    try {
      const res = await fetch(`/api/event-types/${managingSlots.id}/slots`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId }),
      });
      if (res.ok) {
        const updated = managingSlots.slots.filter((s: any) => s.id !== slotId);
        setManagingSlots((prev: any) => ({ ...prev, slots: updated }));
        setEventTypes(prev => prev.map(et =>
          et.id === managingSlots.id ? { ...et, slots: updated } : et
        ));
        toast.success("Créneau supprimé");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur réseau");
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
                    {/* Section Créneaux */}
                    <div className="mt-3 border-t pt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        📅 Créneaux disponibles ({et.slots?.length || 0})
                      </p>
                      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                          {et.slots && et.slots.length > 0 ? (
                            et.slots.map((slot: any) => (
                              <div key={slot.id} className="flex items-center justify-between text-xs bg-purple-50 text-purple-700 rounded px-2 py-1">
                                <span className="font-medium">
                                  {new Date(slot.dateDebut).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })}
                                </span>
                                <span>
                                  {new Date(slot.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} → {new Date(slot.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 italic">Aucun créneau configuré</p>
                          )}
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-gray-500">{et._count?.bookings || 0} réservation(s)</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openSlotsModal(et)} title="Gérer les créneaux" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                          <Calendar className="w-4 h-4" />
                        </Button>
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

      {/* Modal gestion des créneaux */}
      {managingSlots && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Créneaux — {managingSlots.titre}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setManagingSlots(null)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Créneaux existants */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Créneaux configurés ({managingSlots.slots?.length || 0})</h3>
                {managingSlots.slots?.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucun créneau configuré</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {managingSlots.slots?.map((slot: any) => (
                      <div key={slot.id} className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2">
                        <div className="text-sm">
                          <span className="font-medium text-purple-800">
                            {new Date(slot.dateDebut).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-purple-600 ml-2">
                            {new Date(slot.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} → {new Date(slot.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSlot(slot.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ajouter de nouveaux créneaux */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Ajouter des créneaux</h3>
                <SlotsManager
                  slots={newSlots}
                  onChange={setNewSlots}
                  duration={managingSlots.duree}
                  defaultMode={modalSlotsManagerMode}
                  onModeChange={setModalSlotsManagerMode}
                />
                {newSlots.length > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600">{newSlots.length} créneau(x) à ajouter</span>
                    <Button
                      onClick={handleAddSlots}
                      disabled={savingSlots}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {savingSlots ? "Enregistrement..." : `Enregistrer ${newSlots.length} créneau(x)`}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  <LocationSelector 
                    value={form.location}
                    onChange={(location) => setForm(f => ({...f, location}))}
                  />
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
                
                {/* Section Disponibilités */}
                <div className="border-t pt-4">
                  <SlotsManager 
                    slots={slots} 
                    onChange={setSlots}
                    duration={parseInt(form.duration)}
                    defaultMode={slotsManagerMode}
                    onModeChange={setSlotsManagerMode}
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? "Création..." : slots.length > 0 ? "Créer avec créneaux" : "Créer"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setSlots([]); }} className="flex-1">
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
