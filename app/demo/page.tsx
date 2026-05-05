"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, CheckCircle, ArrowRight, Play, Pause, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDate, setSelectedDate] = useState("15 janvier 2024");
  const [selectedTime, setSelectedTime] = useState("14:00");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const demoSteps = [
    {
      title: "1. Découvrez le professionnel",
      description: "Consultez le profil, les spécialités et les disponibilités",
      component: "professional"
    },
    {
      title: "2. Choisissez votre date",
      description: "Sélectionnez une date disponible dans le calendrier",
      component: "calendar"
    },
    {
      title: "3. Sélectionnez un créneau",
      description: "Choisissez l'heure qui vous convient",
      component: "time"
    },
    {
      title: "4. Remplissez vos informations",
      description: "Indiquez vos coordonnées pour la confirmation",
      component: "form"
    },
    {
      title: "5. Confirmez votre rendez-vous",
      description: "Recevez une confirmation instantanée par email",
      component: "confirmation"
    }
  ];

  const professionalInfo = {
    name: "Dr. Sophie Martin",
    profession: "Coach professionnelle",
    avatar: "SM",
    specialties: ["Coaching carrière", "Développement personnel", "Leadership"],
    duration: "60 min",
    location: "Visioconférence",
    rating: 4.9,
    reviews: 127
  };

  const availableTimes = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= demoSteps.length - 1) {
            setIsPlaying(false);
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const renderDemoContent = () => {
    switch (demoSteps[currentStep].component) {
      case "professional":
        return (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {professionalInfo.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{professionalInfo.name}</h3>
                  <p className="text-gray-600">{professionalInfo.profession}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {professionalInfo.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <div className="flex items-center mr-4">
                      <Clock className="w-4 h-4 mr-1" />
                      {professionalInfo.duration}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {professionalInfo.rating} ⭐ ({professionalInfo.reviews} avis)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "calendar":
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Choisissez une date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center">
                {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map(day => (
                  <div key={day} className="text-xs font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const dayNum = i - 2;
                  const isCurrentMonth = dayNum >= 1 && dayNum <= 31;
                  const isSelected = dayNum === 15;
                  const isUnavailable = [5, 12, 19, 26].includes(dayNum);
                  
                  return (
                    <div
                      key={i}
                      className={`
                        py-2 rounded cursor-pointer transition-colors
                        ${!isCurrentMonth ? 'text-gray-300' : ''}
                        ${isUnavailable ? 'bg-gray-100 text-gray-400 line-through' : ''}
                        ${isSelected ? 'bg-blue-600 text-white' : ''}
                        ${!isUnavailable && !isSelected && isCurrentMonth ? 'hover:bg-blue-50' : ''}
                      `}
                    >
                      {isCurrentMonth ? dayNum : ''}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Date sélectionnée : <strong>{selectedDate}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case "time":
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Choisissez un créneau horaire</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Disponibilités pour {selectedDate}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    variant={time === selectedTime ? "default" : "outline"}
                    className="py-3"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Créneau sélectionné : <strong>{selectedTime}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case "form":
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Vos informations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Rendez-vous sélectionné:</strong><br />
                  {selectedDate} à {selectedTime}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Jean Dupont"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="jean.dupont@exemple.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+33 6 12 34 56 78"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Rendez-vous confirmé !</h3>
              <p className="text-gray-600 mb-6">
                Votre rendez-vous avec {professionalInfo.name} est confirmé.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
                <div className="space-y-2">
                  <p className="text-sm"><strong>Date:</strong> {selectedDate}</p>
                  <p className="text-sm"><strong>Heure:</strong> {selectedTime}</p>
                  <p className="text-sm"><strong>Durée:</strong> {professionalInfo.duration}</p>
                  <p className="text-sm"><strong>Lieu:</strong> {professionalInfo.location}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Un email de confirmation sera envoyé à {formData.email || "votre@email.com"}
              </p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RendezPro
            </span>
          </div>
          <Link href="/">
            <Button variant="outline">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Demo Header */}
        <div className="text-center mb-8">
          <Badge className="bg-purple-100 text-purple-800 mb-4">
            🎯 Démonstration interactive
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Découvrez comment RendezPro fonctionne
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Suivez les étapes ci-dessous pour voir comment vos clients réservent des rendez-vous en quelques clics
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {demoSteps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                    ${index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                  `}
                >
                  {index + 1}
                </div>
                {index < demoSteps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Info */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {demoSteps[currentStep].title}
          </h2>
          <p className="text-gray-600">
            {demoSteps[currentStep].description}
          </p>
        </div>

        {/* Demo Content */}
        <div className="max-w-2xl mx-auto mb-8">
          {renderDemoContent()}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Précédent
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlay}
              className="flex items-center"
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isPlaying ? 'Pause' : 'Lecture automatique'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Recommencer
            </Button>
          </div>

          <Button
            onClick={handleNext}
            disabled={currentStep === demoSteps.length - 1}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {currentStep === demoSteps.length - 1 ? 'Terminé' : 'Suivant'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12 p-8 bg-white rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Prêt à utiliser RendezPro ?
          </h3>
          <p className="text-gray-600 mb-6">
            Commencez à recevoir des rendez-vous dès aujourd'hui
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Créer un compte gratuit
              </Button>
            </Link>
            <Link href="/booking/demo-booking">
              <Button variant="outline" size="lg">
                Essayer la réservation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
