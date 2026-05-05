"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isBefore, startOfDay, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, MapPin, Video, Phone, Euro, CheckCircle, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type EventType = {
  id: string;
  titre: string;
  description: string | null;
  duree: number;
  prix: number;
  lieu: string;
};

type Availability = {
  jour: string;
  heureDebut: string;
  heureFin: string;
};

type UserData = {
  id: string;
  nom: string;
  prenom: string;
  username: string;
  bio: string | null;
  photo: string | null;
};

type Props = {
  data: {
    user: UserData;
    eventTypes: EventType[];
    availabilities: Availability[];
  };
};

function generateSlots(start: string, end: string, duration: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let cur = sh * 60 + sm;
  const last = eh * 60 + em - duration;
  while (cur <= last) {
    slots.push(
      `${Math.floor(cur / 60).toString().padStart(2, "0")}:${(cur % 60).toString().padStart(2, "0")}`
    );
    cur += duration;
  }
  return slots;
}

function getInitials(prenom: string, nom: string) {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

export default function BookingFlow({ data }: Props) {
  const { user, eventTypes, availabilities } = data;
  const router = useRouter();

  const [selectedType, setSelectedType] = useState<EventType | null>(
    eventTypes.length === 1 ? eventTypes[0] : null
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    message: "",
  });

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    const dow = date.getDay().toString();
    return !availabilities.some((a) => a.jour === dow);
  };

  const slotsForDate = (date: Date): string[] => {
    if (!selectedType) return [];
    const dow = date.getDay().toString();
    const av = availabilities.find((a) => a.jour === dow);
    if (!av) return [];
    return generateSlots(av.heureDebut, av.heureFin, selectedType.duree);
  };

  const slots = selectedDate ? slotsForDate(selectedDate) : [];

  const canSubmit =
    selectedType && selectedDate && selectedTime && form.nom && form.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    const [h, m] = selectedTime!.split(":").map(Number);
    const bookingDate = new Date(selectedDate!);
    bookingDate.setHours(h, m, 0, 0);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientNom: form.nom,
          clientEmail: form.email,
          clientTel: form.telephone,
          clientMsg: form.message,
          date: bookingDate.toISOString(),
          eventTypeId: selectedType!.id,
          userId: user.id,
        }),
      });

      if (!res.ok) throw new Error("Erreur serveur");

      const params = new URLSearchParams({
        nom: form.nom,
        email: form.email,
        type: selectedType!.titre,
        date: format(selectedDate!, "dd MMMM yyyy", { locale: fr }),
        heure: selectedTime!,
        duree: selectedType!.duree.toString(),
        lieu: selectedType!.lieu,
        pro: `${user.prenom} ${user.nom}`,
      });
      router.push(`/booking/confirmation?${params.toString()}`);
    } catch {
      toast.error("Erreur lors de la réservation. Veuillez réessayer.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            RendezPro
          </Link>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>Vous avez un compte ?</span>
            <Link href="/auth/login" className="text-indigo-600 font-medium hover:underline">
              Se connecter
            </Link>
            <span className="text-gray-400">···</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 flex items-start gap-5">
          {user.photo ? (
            <img
              src={user.photo}
              alt={`${user.prenom} ${user.nom}`}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {getInitials(user.prenom, user.nom)}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {user.prenom} {user.nom}
            </h1>
            {user.bio && (
              <p className="text-gray-600 text-sm mt-1 max-w-lg">{user.bio}</p>
            )}
          </div>
          <div className="flex-shrink-0 hidden sm:block">
            <span className="text-sm text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              rendezpro.fr/{user.username}
            </span>
          </div>
        </div>

        {/* Step 1 — Event type */}
        <div className="mb-8">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center font-bold">
              1
            </span>
            Choisissez un type de rendez-vous
          </h2>

          {eventTypes.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-white rounded-xl border">
              Aucun type de rendez-vous disponible pour ce professionnel.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventTypes.map((et) => {
                const isSelected = selectedType?.id === et.id;
                return (
                  <button
                    key={et.id}
                    onClick={() => {
                      setSelectedType(et);
                      setSelectedDate(undefined);
                      setSelectedTime(null);
                    }}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-200 bg-white hover:border-indigo-300"
                    }`}
                  >
                    <p className={`font-semibold text-sm mb-1 ${isSelected ? "text-white" : "text-gray-900"}`}>
                      {et.titre}
                    </p>
                    {et.description && (
                      <p className={`text-xs mb-3 ${isSelected ? "text-indigo-200" : "text-gray-500"}`}>
                        {et.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`flex items-center gap-1 ${isSelected ? "text-indigo-100" : "text-gray-500"}`}>
                        <Clock className="w-3 h-3" />
                        {et.duree} min
                      </span>
                      <span className={`font-bold ${isSelected ? "text-white" : "text-indigo-600"}`}>
                        {et.prix === 0 ? "Gratuit" : `${et.prix}€`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Steps 2 + 3 — Calendar + Form */}
        {selectedType && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step 2 — Calendar + slots */}
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center font-bold">
                  2
                </span>
                Choisissez une date
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d);
                    setSelectedTime(null);
                  }}
                  disabled={isDateDisabled}
                  locale={fr}
                  fromDate={new Date()}
                  className="w-full"
                />

                {selectedDate && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Créneaux disponibles —{" "}
                      {format(selectedDate, "EEEE d MMMM", { locale: fr })}
                    </p>
                    {slots.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Aucun créneau disponible ce jour.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedTime(t)}
                            className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                              selectedTime === t
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-gray-300 text-gray-700 hover:border-indigo-400"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3 — Form */}
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center font-bold">
                  3
                </span>
                Vos informations
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                {/* Recap */}
                {selectedDate && selectedTime ? (
                  <div className="bg-indigo-50 rounded-lg p-4 mb-5 border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">
                      Récapitulatif
                    </p>
                    <p className="text-sm font-semibold text-indigo-800">
                      {selectedType.titre} · {selectedType.duree} min
                    </p>
                    <p className="text-sm text-indigo-700 capitalize">
                      {format(selectedDate, "EEEE d MMMM", { locale: fr })} ·{" "}
                      {selectedTime}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-indigo-600">
                      {selectedType.lieu.toLowerCase().includes("visio") ? (
                        <Video className="w-3 h-3" />
                      ) : selectedType.lieu.toLowerCase().includes("téléphone") ? (
                        <Phone className="w-3 h-3" />
                      ) : (
                        <MapPin className="w-3 h-3" />
                      )}
                      {selectedType.lieu}
                      {selectedType.prix > 0 && (
                        <span className="ml-2 flex items-center gap-0.5">
                          <Euro className="w-3 h-3" />
                          {selectedType.prix}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 mb-5 text-sm text-gray-500 text-center">
                    Sélectionnez une date et un créneau
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nom" className="text-sm font-medium text-gray-700">
                      Prénom et nom *
                    </Label>
                    <Input
                      id="nom"
                      value={form.nom}
                      onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                      placeholder="Votre nom complet"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="votre@email.com"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tel" className="text-sm font-medium text-gray-700">
                      Téléphone
                    </Label>
                    <Input
                      id="tel"
                      type="tel"
                      value={form.telephone}
                      onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                      placeholder="+33 6 00 00 00 00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="msg" className="text-sm font-medium text-gray-700">
                      Message (optionnel)
                    </Label>
                    <textarea
                      id="msg"
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      placeholder="Précisez votre demande..."
                      rows={3}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours...</>
                    ) : (
                      <>Confirmer la réservation <ChevronRight className="w-4 h-4" /></>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Confirmation envoyée par email automatiquement
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
