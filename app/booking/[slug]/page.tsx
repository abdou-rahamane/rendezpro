"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, MapPin, Video, CheckCircle, Euro, Loader2, Users, User } from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

function generateTimeSlots(startTime: string, endTime: string, duration: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM - duration;
  while (current <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += duration;
  }
  return slots;
}

export default function BookingPage({ params }: { params: { slug: string } }) {
  alert('BookingPage chargé avec slug: ' + params.slug)
  console.log('=== BOOKINGFLOW CHARGÉ ===')
  const [eventType, setEventType] = useState<any>(null);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [step, setStep] = useState(1);

  const isHeureFixe = useMemo(() => {
  if (!eventType) return false
  return eventType.typeRDV === 'collectif' && 
         eventType.heureFixe !== null && 
         eventType.heureFixe !== undefined &&
         eventType.heureFixe !== ''
}, [eventType])

  useEffect(() => {
    if (isHeureFixe && eventType?.heureFixe) {
      setSelectedTime(eventType.heureFixe)
    }
  }, [isHeureFixe, eventType])

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });

  useEffect(() => {
    fetch(`/api/public/event-types/${params.slug}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => {
        if (data) {
          console.log('=== EVENTTYPE DATA ===', data.eventType)
          setEventType(data.eventType);
          setAvailabilities(data.availabilities);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setPageLoading(false));
  }, [params.slug]);

  // Auto-set selectedTime for fixed hour appointments
  useEffect(() => {
    if (isHeureFixe && eventType?.heureFixe) {
      setSelectedTime(eventType.heureFixe)
    }
  }, [isHeureFixe, eventType])

  // Calculer les créneaux disponibles pour la date sélectionnée
  const getAvailableSlots = (date: Date): string[] => {
    if (!date || !eventType) return [];
    const dayOfWeek = date.getDay(); // 0=Dimanche, 1=Lundi...
    const availability = availabilities.find(a => a.jour === dayOfWeek.toString());
    if (!availability || !availability.actif) return [];
    return generateTimeSlots(availability.heureDebut, availability.heureFin, eventType.duree);
  };

  // Désactiver les jours sans disponibilité
  const isDateDisabled = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    const dayOfWeek = date.getDay();
    const availability = availabilities.find(a => a.jour === dayOfWeek.toString());
    if (!availability || !availability.actif) return true;

    // Si RDV collectif avec heure fixe, vérifier que l'heure fixe est dans la plage d'ouverture
    if (isHeureFixe && eventType.heureFixe) {
      const [h] = eventType.heureFixe.split(":").map(Number);
      const [startH] = availability.heureDebut.split(":").map(Number);
      const [endH] = availability.heureFin.split(":").map(Number);
      if (h < startH || h >= endH) return true;
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !eventType) return;
    setSubmitting(true);
    try {
      const [h, m] = selectedTime.split(":").map(Number);
      const bookingDate = new Date(selectedDate);
      bookingDate.setHours(h, m, 0, 0);

      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientNom: formData.name,
          clientEmail: formData.email,
          clientTel: formData.phone,
          clientMsg: formData.message,
          date: bookingDate.toISOString(),
          eventTypeId: eventType.id,
          userId: eventType.userId,
        }),
      });

      if (res.ok) {
        setStep(3);
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Erreur lors de la réservation");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (notFound || !eventType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Page introuvable</h2>
            <p className="text-gray-600">Ce lien de réservation n'existe pas ou n'est plus actif.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profName = `${eventType.user?.prenom || ""} ${eventType.user?.nom || ""}`.trim();
  const profInitials = profName.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "?";
  const availableSlots = selectedDate ? getAvailableSlots(selectedDate) : [];

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Rendez-vous confirmé !</h2>
            <p className="text-gray-600 mb-6">Votre réservation avec {profName} a bien été enregistrée.</p>
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm"><strong>Type :</strong> {eventType.titre}</p>
              {eventType.description && <p className="text-sm"><strong>Description :</strong> {eventType.description}</p>}
              <p className="text-sm"><strong>Date :</strong> {selectedDate && format(selectedDate, "dd MMMM yyyy", { locale: fr })}</p>
              <p className="text-sm"><strong>Heure :</strong> {selectedTime}</p>
              <p className="text-sm"><strong>Durée :</strong> {eventType.duree} min</p>
              <p className="text-sm"><strong>Lieu :</strong> {eventType.lieu}</p>
              {eventType.prix > 0 && <p className="text-sm"><strong>Prix :</strong> {eventType.prix}€</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div key={eventType?.id || 'loading'} className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">RendezPro</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Pro info */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {profInitials}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{profName}</h1>
                <p className="text-lg text-blue-600 font-medium">{eventType.titre}</p>
                {eventType.description && <p className="text-gray-600 text-sm mt-1">{eventType.description}</p>}
              </div>
              <div className="flex flex-col gap-2 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{eventType.duree} min</span>
                <span className="flex items-center gap-1">
                  {eventType.lieu?.toLowerCase().includes("visio") ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  {eventType.lieu}
                </span>
                {eventType.prix > 0 && <span className="flex items-center gap-1"><Euro className="w-4 h-4" />{eventType.prix}€</span>}
                <Badge variant="outline" className={eventType.typeRDV === 'collectif' ? 'border-purple-300 text-purple-700 bg-purple-50 w-fit' : 'border-blue-300 text-blue-700 bg-blue-50 w-fit'}>
                  {eventType.typeRDV === 'collectif'
                    ? <><Users className="w-3 h-3 mr-1" />Collectif (max {eventType.maxParticipants} pers.)</>
                    : <><User className="w-3 h-3 mr-1" />Individuel</>}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />Choisissez une date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={date => {
                  setSelectedDate(date);
                  if (isHeureFixe) {
                    setSelectedTime(eventType.heureFixe);
                    setStep(2);
                  } else {
                    setSelectedTime(undefined);
                    setStep(1);
                  }
                }}
                disabled={isDateDisabled}
                className="rounded-md border w-full"
                locale={fr}
                fromDate={new Date()}
              />
            </CardContent>
          </Card>

          {/* Slots or Form */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>{step === 1 ? "Choisissez un créneau" : "Vos informations"}</CardTitle>
            </CardHeader>
            <CardContent>
              {step === 1 ? (
                <div>
                  {isHeureFixe ? (
  <div style={{ marginTop: '16px' }}>
    <p style={{ 
      fontSize: '14px', 
      color: '#534AB7', 
      fontWeight: 500, 
      marginBottom: '12px' 
    }}>
      Heure fixée par le professionnel
    </p>
    <div style={{ 
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      background: '#534AB7',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 500,
    }}>
      <span>🔒</span>
      <span>{eventType.heureFixe}</span>
    </div>
    <p style={{ 
      fontSize: '12px', 
      color: '#888', 
      marginTop: '8px' 
    }}>
      L'heure est fixée — vous pouvez uniquement choisir la date
    </p>
  </div>
) : (
  <div className="grid grid-cols-3 gap-2 mt-4">
    {availableSlots.map((slot: string) => (
      <button
        key={slot}
        onClick={() => setSelectedTime(slot)}
        style={{
          padding: '8px',
          borderRadius: '8px',
          border: selectedTime === slot 
            ? 'none' 
            : '1px solid #e5e7eb',
          background: selectedTime === slot 
            ? '#534AB7' 
            : 'white',
          color: selectedTime === slot 
            ? 'white' 
            : '#333',
          cursor: 'pointer',
          fontSize: '13px'
        }}
      >
        {slot}
      </button>
    ))}
  </div>
)}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className={`rounded-lg p-3 text-sm ${isHeureFixe ? 'bg-purple-50 text-purple-800' : 'bg-blue-50 text-blue-800'}`}>
                    <strong>{selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: fr })}</strong> à <strong>{selectedTime}</strong>
                    {isHeureFixe && <span className="ml-2 text-xs font-normal opacity-75">(heure fixée par le professionnel)</span>}
                  </div>
                  <div>
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))} required placeholder="Jean Dupont" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData(f => ({...f, email: e.target.value}))} required placeholder="jean@exemple.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData(f => ({...f, phone: e.target.value}))} placeholder="+33 6 12 34 56 78" />
                  </div>
                  <div>
                    <Label htmlFor="msg">Message (optionnel)</Label>
                    <textarea
                      id="msg"
                      className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={formData.message}
                      onChange={e => setFormData(f => ({...f, message: e.target.value}))}
                      placeholder="Objet du rendez-vous..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Retour</Button>
                    <Button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi...</> : "Confirmer la réservation"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
