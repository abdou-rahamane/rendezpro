"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Clock, CheckCircle, ArrowRight, Play, Pause,
  RotateCcw, MapPin, Video, DollarSign, User, Shield, Mail, Phone
} from "lucide-react";
import Link from "next/link";

const DEMO_PRO = {
  name: "Dr. Sophie Martin",
  profession: "Coach professionnelle",
  avatar: "SM",
  specialties: ["Coaching carrière", "Développement personnel", "Leadership"],
  ville: "Paris",
  rating: 4.9,
  reviews: 127,
};

const DEMO_EVENT_TYPES = [
  { id: "1", titre: "Séance de coaching individuel", description: "Accompagnement personnalisé", duree: 60, prix: 80, lieu: "visio" },
  { id: "2", titre: "Bilan de compétences", description: "Évaluation complète de vos compétences", duree: 90, prix: 120, lieu: "cabinet" },
];

const DEMO_SLOTS = [
  { id: "s1", label: "Mercredi 11 juin 2026", heureDebut: "09:00", heureFin: "10:00" },
  { id: "s2", label: "Jeudi 12 juin 2026",   heureDebut: "14:00", heureFin: "15:00" },
  { id: "s3", label: "Vendredi 13 juin 2026", heureDebut: "10:00", heureFin: "11:00" },
  { id: "s4", label: "Lundi 16 juin 2026",    heureDebut: "16:00", heureFin: "17:00" },
];

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [formData, setFormData] = useState({ name: "Mohamed Dupont", email: "mohamed@exemple.com", phone: "" });

  const demoSteps = [
    { title: "1. Découvrez le professionnel",      description: "Consultez le profil et les prestations disponibles",          component: "professional" },
    { title: "2. Choisissez le type de RDV",       description: "Sélectionnez la prestation qui vous convient",                component: "eventtype"    },
    { title: "3. Sélectionnez vos créneaux",       description: "Cochez un ou plusieurs créneaux disponibles",                 component: "slots"        },
    { title: "4. Renseignez vos informations",     description: "Indiquez vos coordonnées pour la confirmation",              component: "form"         },
    { title: "5. Réservation confirmée",           description: "Un seul email récapitulatif avec tous vos créneaux",         component: "confirmation" },
  ];

  const toggleSlot = (id: string) =>
    setSelectedSlots(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const handleNext = () => { if (currentStep < demoSteps.length - 1) setCurrentStep(currentStep + 1); };
  const handlePrevious = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };
  const handleReset = () => { setCurrentStep(0); setIsPlaying(false); setSelectedEventType(null); setSelectedSlots([]); };

  const handlePlay = () => {
    setIsPlaying(v => !v);
    if (!isPlaying) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= demoSteps.length - 1) { setIsPlaying(false); clearInterval(interval); return prev; }
          return prev + 1;
        });
      }, 3000);
    }
  };

  const selectedET = DEMO_EVENT_TYPES.find(e => e.id === selectedEventType);
  const bookedSlots = DEMO_SLOTS.filter(s => selectedSlots.includes(s.id));

  const renderContent = () => {
    switch (demoSteps[currentStep].component) {

      case "professional":
        return (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {DEMO_PRO.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{DEMO_PRO.name}</h3>
                  <p className="text-indigo-600 font-medium">{DEMO_PRO.profession}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{DEMO_PRO.ville}</span>
                    <span>⭐ {DEMO_PRO.rating} ({DEMO_PRO.reviews} avis)</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DEMO_PRO.specialties.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Prestations proposées</p>
                <div className="space-y-2">
                  {DEMO_EVENT_TYPES.map(et => (
                    <div key={et.id} className="flex items-center justify-between bg-indigo-50 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{et.titre}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3" />{et.duree} min
                          {et.lieu === 'visio' ? <><Video className="w-3 h-3" />Visio</> : <><MapPin className="w-3 h-3" />Cabinet</>}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-indigo-700">{et.prix}€</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "eventtype":
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle className="text-base">Choisissez une prestation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {DEMO_EVENT_TYPES.map(et => (
                <div
                  key={et.id}
                  onClick={() => setSelectedEventType(et.id)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedEventType === et.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{et.titre}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{et.description}</p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-indigo-400" />{et.duree} min</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-indigo-400" />{et.prix}€</span>
                        <span className="flex items-center gap-1">
                          {et.lieu === 'visio' ? <><Video className="w-3 h-3 text-indigo-400" />Visio</> : <><MapPin className="w-3 h-3 text-indigo-400" />Cabinet</>}
                        </span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center ${selectedEventType === et.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                      {selectedEventType === et.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                </div>
              ))}
              {!selectedEventType && <p className="text-xs text-amber-600 text-center pt-1">👆 Sélectionnez une prestation pour continuer</p>}
            </CardContent>
          </Card>
        );

      case "slots":
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">Sélectionnez vos créneaux</CardTitle>
              <p className="text-xs text-indigo-600 font-medium">Vous pouvez cocher plusieurs créneaux ({selectedSlots.length} sélectionné{selectedSlots.length > 1 ? 's' : ''})</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_SLOTS.map(slot => {
                const checked = selectedSlots.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    onClick={() => toggleSlot(slot.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                      checked ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      <p className={`font-semibold capitalize text-sm ${checked ? 'text-indigo-700' : 'text-gray-800'}`}>{slot.label}</p>
                      <p className={`text-xs mt-0.5 ${checked ? 'text-indigo-600' : 'text-gray-500'}`}>
                        {slot.heureDebut} → {slot.heureFin}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center ${checked ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                      {checked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
              {selectedSlots.length === 0 && <p className="text-xs text-amber-600 text-center pt-1">👆 Cochez au moins un créneau pour continuer</p>}
            </CardContent>
          </Card>
        );

      case "form":
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle className="text-base">Vos informations</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Récapitulatif</p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><span className="font-medium">Prestation :</span> {selectedET?.titre ?? DEMO_EVENT_TYPES[0].titre}</p>
                  <p><span className="font-medium">{bookedSlots.length || 2} créneau{(bookedSlots.length || 2) > 1 ? 'x' : ''} :</span></p>
                  <div className="pl-2 space-y-0.5">
                    {(bookedSlots.length > 0 ? bookedSlots : DEMO_SLOTS.slice(0, 2)).map(s => (
                      <p key={s.id} className="text-indigo-700 text-xs">• {s.label} de {s.heureDebut} à {s.heureFin}</p>
                    ))}
                  </div>
                  <p><span className="font-medium">Total :</span> {(selectedET?.prix ?? 80) * (bookedSlots.length || 2)}€</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nom complet <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Téléphone <span className="text-gray-400 font-normal">(optionnel)</span></label>
                  <input type="tel" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="06 12 34 56 78" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                  <Shield className="w-4 h-4 text-green-500 shrink-0" />
                  Un seul email récapitulatif vous sera envoyé avec tous vos créneaux.
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "confirmation":
        return (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Réservation confirmée !</h3>
              <p className="text-gray-500 mb-5 text-sm">
                {formData.name || "Mohamed"} a réservé <strong>{bookedSlots.length || 2} créneau{(bookedSlots.length || 2) > 1 ? 'x' : ''}</strong> avec {DEMO_PRO.name}
              </p>
              <div className="bg-gray-50 rounded-xl p-4 text-left mb-5 space-y-2 text-sm text-gray-700">
                <p><span className="font-medium">Prestation :</span> {selectedET?.titre ?? DEMO_EVENT_TYPES[0].titre}</p>
                <p className="font-medium">{bookedSlots.length || 2} créneau{(bookedSlots.length || 2) > 1 ? 'x' : ''} réservé{(bookedSlots.length || 2) > 1 ? 's' : ''} :</p>
                <div className="pl-2 space-y-1">
                  {(bookedSlots.length > 0 ? bookedSlots : DEMO_SLOTS.slice(0, 2)).map(s => (
                    <p key={s.id} className="text-indigo-700">• {s.label} de {s.heureDebut} à {s.heureFin}</p>
                  ))}
                </div>
                <p><span className="font-medium">Total :</span> {(selectedET?.prix ?? 80) * (bookedSlots.length || 2)}€</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
                <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1"><Mail className="w-3.5 h-3.5" />Un seul email envoyé à {formData.email || "mohamed@exemple.com"} :</p>
                <p className="text-xs text-green-600">✅ Récapitulatif complet avec tous les créneaux</p>
                <p className="text-xs text-green-600">✅ Lien d'annulation individuel par créneau</p>
                <p className="text-xs text-green-600">✅ Coordonnées du professionnel</p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">RendezPro</span>
          </div>
          <Link href="/"><Button variant="outline">Retour à l'accueil</Button></Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <Badge className="bg-purple-100 text-purple-800 mb-4">🎯 Démonstration interactive</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Découvrez comment RendezPro fonctionne</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Suivez les étapes ci-dessous pour voir comment vos clients réservent des rendez-vous en quelques clics
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            {demoSteps.map((step, index) => (
              <div key={index} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(index)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    index < currentStep ? 'bg-green-500 text-white' :
                    index === currentStep ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' :
                    'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
                </button>
                {index < demoSteps.length - 1 && (
                  <div className={`w-12 h-1 mx-1 ${index < currentStep ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{demoSteps[currentStep].title}</h2>
          <p className="text-gray-600">{demoSteps[currentStep].description}</p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">{renderContent()}</div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>Précédent</Button>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePlay} className="flex items-center">
              {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isPlaying ? 'Pause' : 'Lecture automatique'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="flex items-center">
              <RotateCcw className="w-4 h-4 mr-1" />Recommencer
            </Button>
          </div>
          <Button
            onClick={handleNext}
            disabled={currentStep === demoSteps.length - 1}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {currentStep === demoSteps.length - 1 ? 'Terminé ✓' : 'Suivant'}
            {currentStep < demoSteps.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        <div className="text-center mt-12 p-8 bg-white rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Prêt à utiliser RendezPro ?</h3>
          <p className="text-gray-600 mb-6">Commencez à recevoir des rendez-vous dès aujourd'hui</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Créer un compte gratuit
              </Button>
            </Link>
            <Link href="/recherche">
              <Button variant="outline" size="lg">Trouver un professionnel</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
