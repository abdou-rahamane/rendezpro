"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, MapPin, Video, CheckCircle, Euro, Loader2, Users, User, Lock } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
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
  console.log('=== BOOKING PAGE LOADED ===');
  const [eventType, setEventType] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [step, setStep] = useState(1);
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
          setEventType(data.eventType);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setPageLoading(false));
  }, [params.slug]);

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !eventType) return;
    setSubmitting(true);
    try {
      const bookingDate = new Date(selectedSlot.dateDebut);
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
        const data = await res.json().catch(() => ({}));
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (notFound || !eventType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Page introuvable</h2>
            <p className="text-gray-600">Ce lien de réservation n'existe pas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profName = `${eventType.user?.prenom || ""} ${eventType.user?.nom || ""}`.trim();
  const profInitials = profName.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "?";

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Rendez-vous confirmé !</h2>
            <p className="text-gray-600 mb-6">Votre réservation avec {profName} a bien été enregistrée.</p>
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm"><strong>Type :</strong> {eventType.titre}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">RendezPro</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
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
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                className="rounded-md border w-full"
                locale={fr}
                fromDate={new Date()}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>
                {step === 2 ? "Vos informations" : "Choisissez un créneau"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step === 1 && (
                <div>
                  {eventType.slotsDisponibles?.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun créneau disponible pour ce rendez-vous</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {eventType.slotsDisponibles.map((slot: any) => (
                        <button
                          key={slot.id}
                          onClick={() => handleSlotSelect(slot)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            selectedSlot?.id === slot.id
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">
                                {format(new Date(slot.dateDebut), "EEEE dd MMMM yyyy", { locale: fr })}
                              </p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(slot.dateDebut), "HH:mm")} → {format(new Date(slot.dateFin), "HH:mm")}
                              </p>
                            </div>
                            {eventType.typeRDV === 'collectif' && eventType.placesRestantes !== null && (
                              <div className="text-right">
                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                  eventType.placesRestantes <= 3
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {eventType.placesRestantes} place{eventType.placesRestantes > 1 ? 's' : ''} restante{eventType.placesRestantes > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="rounded-lg p-3 text-sm bg-purple-50 text-purple-800 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                    <span>
                      <strong>
                        {selectedSlot && format(new Date(selectedSlot.dateDebut), "dd/MM/yyyy", { locale: fr })}
                      </strong>
                      {" de "}
                      <strong>{selectedSlot && format(new Date(selectedSlot.dateDebut), "HH:mm")}</strong>
                      {" à "}
                      <strong>{selectedSlot && format(new Date(selectedSlot.dateFin), "HH:mm")}</strong>
                    </span>
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
