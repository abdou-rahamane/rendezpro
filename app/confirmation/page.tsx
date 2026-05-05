"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Video, 
  MapPin,
  ArrowLeft,
  Download,
  Share2,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ConfirmationPage() {
  // Mock data - would come from URL params or API
  const appointmentData = {
    clientName: "Jean Dupont",
    clientEmail: "jean.dupont@email.com",
    professionalName: "Dr. Sophie Martin",
    profession: "Coach professionnelle",
    type: "Séance coaching",
    date: new Date(2024, 0, 15), // 15 janvier 2024
    time: "14:00 - 15:00",
    duration: "60 minutes",
    location: "Visioconférence",
    meetingLink: "https://zoom.us/j/123456789",
    price: "80€",
    notes: "N'oubliez pas d'arriver 5 minutes en avance pour tester votre connexion.",
    professionalEmail: "sophie.martin@rendezpro.fr",
    professionalPhone: "+33 6 12 34 56 78"
  };

  const [showCalendarOptions, setShowCalendarOptions] = useState(false);

  const formattedDate = format(appointmentData.date, "EEEE d MMMM yyyy", { locale: fr });

  const addToCalendar = (type: string) => {
    // Generate calendar event data
    const startDate = new Date(appointmentData.date);
    const [startTime] = appointmentData.time.split(" - ");
    const [hours, minutes] = startTime.split(":");
    startDate.setHours(parseInt(hours), parseInt(minutes));

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 60); // 60 minutes duration

    const eventTitle = `${appointmentData.type} avec ${appointmentData.professionalName}`;
    const eventDescription = `Rendez-vous de ${appointmentData.type}\n\n${appointmentData.professionalName} - ${appointmentData.profession}\n\n${appointmentData.notes || ""}`;
    
    let calendarUrl = "";
    
    if (type === "google") {
      const googleCalendarUrl = "https://calendar.google.com/calendar/render";
      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: eventTitle,
        dates: `${startDate.toISOString().replace(/-|:|\.\d\d\d/g, "")}/${endDate.toISOString().replace(/-|:|\.\d\d\d/g, "")}`,
        details: eventDescription,
        location: appointmentData.location === "Visioconférence" ? appointmentData.meetingLink : "À définir"
      });
      calendarUrl = `${googleCalendarUrl}?${params.toString()}`;
    } else if (type === "outlook") {
      const outlookUrl = "https://outlook.live.com/calendar/0/deeplink/compose";
      const params = new URLSearchParams({
        subject: eventTitle,
        startdt: startDate.toISOString(),
        enddt: endDate.toISOString(),
        body: eventDescription,
        location: appointmentData.location === "Visioconférence" ? appointmentData.meetingLink : "À définir"
      });
      calendarUrl = `${outlookUrl}?${params.toString()}`;
    }

    if (calendarUrl) {
      window.open(calendarUrl, "_blank");
    }
  };

  const shareAppointment = () => {
    const shareText = `Rendez-vous confirmé : ${appointmentData.type} avec ${appointmentData.professionalName}\n${formattedDate} à ${appointmentData.time}\n\n${appointmentData.location === "Visioconférence" ? `Lien : ${appointmentData.meetingLink}` : ""}`;
    
    if (navigator.share) {
      navigator.share({
        title: "Rendez-vous confirmé",
        text: shareText
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert("Les détails du rendez-vous ont été copiés dans le presse-papiers");
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
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rendez-vous confirmé !
          </h1>
          <p className="text-lg text-gray-600">
            Votre rendez-vous avec {appointmentData.professionalName} est confirmé.
          </p>
        </div>

        {/* Main Confirmation Card */}
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Appointment Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Détails du rendez-vous
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{formattedDate}</p>
                        <p className="text-sm text-gray-600">{appointmentData.time}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Durée</p>
                        <p className="text-sm text-gray-600">{appointmentData.duration}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Badge className="bg-blue-100 text-blue-800">
                        {appointmentData.type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      {appointmentData.location === "Visioconférence" ? (
                        <Video className="w-5 h-5 text-gray-400 mt-0.5" />
                      ) : (
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{appointmentData.location}</p>
                        {appointmentData.location === "Visioconférence" && (
                          <p className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer">
                            {appointmentData.meetingLink}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Info */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Informations du professionnel
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        SM
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{appointmentData.professionalName}</p>
                        <p className="text-sm text-gray-600">{appointmentData.profession}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {appointmentData.professionalEmail}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {appointmentData.professionalPhone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Client Info & Actions */}
              <div className="space-y-6">
                {/* Client Info */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Vos informations
                  </h2>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-900">
                        <User className="w-4 h-4 mr-2" />
                        {appointmentData.clientName}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {appointmentData.clientEmail}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Actions rapides
                  </h3>
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => setShowCalendarOptions(!showCalendarOptions)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Ajouter à mon calendrier
                    </Button>
                    
                    {showCalendarOptions && (
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => addToCalendar("google")}
                          className="flex items-center"
                        >
                          Google Calendar
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => addToCalendar("outlook")}
                          className="flex items-center"
                        >
                          Outlook
                        </Button>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={shareAppointment}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager le rendez-vous
                    </Button>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Tarif
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-gray-900">{appointmentData.price}</p>
                    <p className="text-sm text-gray-600">Payable le jour du rendez-vous</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {appointmentData.notes && (
              <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-gray-900 mb-2">Notes importantes</h4>
                <p className="text-gray-700">{appointmentData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Confirmation Notice */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <Mail className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Email de confirmation envoyé
            </h3>
            <p className="text-gray-600 mb-4">
              Un email récapitulatif a été envoyé à {appointmentData.clientEmail}
            </p>
            <p className="text-sm text-gray-500">
              Vous recevrez également un rappel 24 heures avant votre rendez-vous.
            </p>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/booking">
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Prendre un autre rendez-vous
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
