"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle, Calendar, Clock, MapPin, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

function ConfirmationContent() {
  const params = useSearchParams();

  const nom = params.get("nom") ?? "";
  const email = params.get("email") ?? "";
  const type = params.get("type") ?? "";
  const date = params.get("date") ?? "";
  const heure = params.get("heure") ?? "";
  const duree = params.get("duree") ?? "";
  const lieu = params.get("lieu") ?? "";
  const pro = params.get("pro") ?? "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            RendezPro
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-lg p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Rendez-vous confirmé !
          </h1>
          <p className="text-gray-600 mb-8">
            {nom ? `Merci ${nom.split(" ")[0]}, votre` : "Votre"} réservation avec{" "}
            <span className="font-semibold text-gray-900">{pro}</span> a bien
            été enregistrée.
          </p>

          {/* Details */}
          <div className="bg-indigo-50 rounded-xl p-5 text-left space-y-3 mb-8 border border-indigo-100">
            <h2 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-3">
              Détails du rendez-vous
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="capitalize">{date}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>
                {heure} · {duree} min
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>{lieu}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <User className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>{type}</span>
            </div>
            {email && (
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span>{email}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Un email de confirmation a été envoyé à{" "}
            <span className="font-medium text-gray-700">{email}</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Retour à l'accueil</Link>
            </Button>
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                if (typeof window !== "undefined" && date && heure) {
                  const dateObj = new Date();
                  window.open(
                    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(type + " avec " + pro)}&dates=${dateObj.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z/${dateObj.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
                    "_blank"
                  );
                }
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Ajouter au calendrier
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
