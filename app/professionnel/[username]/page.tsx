"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, Clock, Star, MapPin, CheckCircle,
  ChevronLeft, ChevronRight, Video, Shield, DollarSign, User
} from "lucide-react"

interface Professional {
  id: string
  prenom: string
  nom: string
  username: string
  bio: string
  photo?: string
  specialite?: string
  ville?: string
  tarifMoyen?: number
  noteMoyenne?: number
  totalAvis?: number
  verification: boolean
  email?: string
  phone?: string
  website?: string
  experience?: number
  eventTypes: Array<{
    id: string
    titre: string
    description?: string
    duree: number
    prix: number
    lieu: string
  }>
  availabilities: Array<{
    jour: string
    heureDebut: string
    heureFin: string
  }>
  reviews: Array<{
    id: string
    clientNom: string
    note: number
    commentaire: string
    date: string
  }>
}

export default function ProfessionalPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [professional, setProfessional] = useState<Professional | null>(null)
  const [step, setStep] = useState(1) // 1=type RDV, 2=date/heure, 3=infos, 4=confirmation
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [clientInfo, setClientInfo] = useState({ nom: '', email: '', phone: '' })

  useEffect(() => {
    if (!username) return
    fetch(`/api/professionnels/${username}`)
      .then(r => r.json())
      .then(data => {
        if (data.id) setProfessional(data)
        else router.push('/recherche')
      })
      .catch(() => router.push('/recherche'))
  }, [username, router])

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const selectedEventTypeData = professional.eventTypes.find(e => e.id === selectedEventType)

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
      }
    }
    return slots
  }

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !selectedEventType || !clientInfo.nom || !clientInfo.email) return
    setSubmitting(true)
    try {
      const [h, m] = selectedTime.split(':').map(Number)
      const bookingDate = new Date(selectedDate)
      bookingDate.setHours(h, m, 0, 0)
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientNom: clientInfo.nom,
          clientEmail: clientInfo.email,
          clientTel: clientInfo.phone || null,
          clientMsg: null,
          date: bookingDate.toISOString(),
          eventTypeId: selectedEventType,
          userId: professional.id,
        }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      setStep(4)
    } catch (err) {
      console.error('Booking error:', err)
      alert('Erreur lors de la réservation. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  const STEPS = [
    { num: 1, label: 'Type de RDV', icon: Calendar },
    { num: 2, label: 'Date & Heure', icon: Clock },
    { num: 3, label: 'Vos infos', icon: User },
    { num: 4, label: 'Confirmation', icon: CheckCircle },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => step > 1 && step < 4 ? setStep(step - 1) : router.back()}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">{step > 1 && step < 4 ? 'Étape précédente' : 'Retour'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Carte professionnel (toujours visible) */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={professional.photo} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg font-bold">
                    {professional.prenom[0]}{professional.nom[0]}
                  </AvatarFallback>
                </Avatar>
                {professional.verification && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 text-lg">{professional.prenom} {professional.nom}</h2>
                <p className="text-indigo-600 text-sm font-medium">{professional.specialite}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {professional.ville && professional.ville !== 'Non spécifié' && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{professional.ville}</span>
                  )}
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{professional.noteMoyenne} ({professional.totalAvis} avis)</span>
                </div>
              </div>
              {selectedEventTypeData && step > 1 && (
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-800">{selectedEventTypeData.titre}</p>
                  <p className="text-xs text-gray-500">{selectedEventTypeData.duree} min · {selectedEventTypeData.prix}€</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stepper */}
        {step < 4 && (
          <div className="flex items-center justify-between mb-8 px-2">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    step === s.num ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' :
                    step > s.num ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${step === s.num ? 'text-indigo-600' : step > s.num ? 'text-green-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${step > s.num ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ÉTAPE 1 : Choisir le type de RDV */}
        {step === 1 && (
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Choisissez un type de rendez-vous</h3>
              <p className="text-sm text-gray-500 mb-5">Sélectionnez la prestation qui vous convient</p>
              <div className="space-y-3">
                {professional.eventTypes.map(type => (
                  <div
                    key={type.id}
                    onClick={() => setSelectedEventType(type.id)}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedEventType === type.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{type.titre}</h4>
                        {type.description && <p className="text-sm text-gray-500 mt-0.5">{type.description}</p>}
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-indigo-400" />{type.duree} min</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-indigo-400" />{type.prix}€</span>
                          <span className="flex items-center gap-1">
                            {type.lieu === 'visio' ? <><Video className="w-4 h-4 text-indigo-400" />Visio</> : <><MapPin className="w-4 h-4 text-indigo-400" />Cabinet</>}
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 ml-4 mt-1 flex items-center justify-center transition-all ${
                        selectedEventType === type.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                      }`}>
                        {selectedEventType === type.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedEventType}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 h-12 text-base"
              >
                Continuer <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ÉTAPE 2 : Choisir date et heure */}
        {step === 2 && (
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Choisissez une date et une heure</h3>
              <p className="text-sm text-gray-500 mb-5">Sélectionnez le créneau qui vous convient</p>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date du rendez-vous</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(null) }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 text-gray-800"
                />
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Heure du rendez-vous</label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {generateTimeSlots().map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-1 text-sm rounded-lg border-2 transition-all font-medium ${
                          selectedTime === time
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 h-12 text-base"
              >
                Continuer <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ÉTAPE 3 : Informations client */}
        {step === 3 && (
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Vos informations</h3>
              <p className="text-sm text-gray-500 mb-5">Renseignez vos coordonnées pour la confirmation</p>

              {/* Récapitulatif */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Récapitulatif</p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><span className="font-medium">Type :</span> {selectedEventTypeData?.titre}</p>
                  <p><span className="font-medium">Date :</span> {selectedDate && new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p><span className="font-medium">Heure :</span> {selectedTime}</p>
                  <p><span className="font-medium">Durée :</span> {selectedEventTypeData?.duree} min · <span className="font-medium">Prix :</span> {selectedEventTypeData?.prix}€</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom complet <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={clientInfo.nom}
                    onChange={(e) => setClientInfo({...clientInfo, nom: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400"
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400"
                    placeholder="jean@exemple.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone <span className="text-gray-400 font-normal">(optionnel)</span></label>
                  <input
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                <Shield className="w-4 h-4 text-green-500 shrink-0" />
                Un email de confirmation vous sera envoyé après la réservation.
              </div>

              <Button
                onClick={handleConfirm}
                disabled={submitting || !clientInfo.nom || !clientInfo.email}
                className="w-full mt-5 bg-indigo-600 hover:bg-indigo-700 h-12 text-base"
              >
                {submitting ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Envoi en cours...</>
                ) : (
                  <>Confirmer la réservation <CheckCircle className="w-5 h-5 ml-2" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ÉTAPE 4 : Confirmation */}
        {step === 4 && (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Rendez-vous confirmé !</h3>
              <p className="text-gray-500 mb-2">
                Votre rendez-vous avec <span className="font-semibold text-gray-700">{professional.prenom} {professional.nom}</span> est enregistré.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Un email de confirmation a été envoyé à <span className="font-medium text-indigo-600">{clientInfo.email}</span>
              </p>

              <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-2 text-sm text-gray-700">
                <p><span className="font-medium">Type :</span> {selectedEventTypeData?.titre}</p>
                <p><span className="font-medium">Date :</span> {selectedDate && new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p><span className="font-medium">Heure :</span> {selectedTime}</p>
                <p><span className="font-medium">Durée :</span> {selectedEventTypeData?.duree} min</p>
              </div>

              <Button onClick={() => router.push('/recherche')} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12">
                Retour à la recherche
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
