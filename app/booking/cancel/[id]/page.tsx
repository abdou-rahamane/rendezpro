"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarX, CheckCircle, Loader2, XCircle } from "lucide-react"

type Status = "idle" | "loading" | "cancelled" | "already_cancelled" | "not_found" | "error"

export default function CancelBookingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [status, setStatus] = useState<Status>("idle")

  const handleCancel = async () => {
    setStatus("loading")
    try {
      const res = await fetch(`/api/booking/${id}/cancel`, { method: "POST" })
      const data = await res.json()

      if (res.ok) {
        setStatus("cancelled")
      } else if (res.status === 400) {
        setStatus("already_cancelled")
      } else if (res.status === 404) {
        setStatus("not_found")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <CalendarX className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-xl">Annuler votre rendez-vous</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          {status === "idle" && (
            <>
              <p className="text-gray-600">
                Êtes-vous sûr de vouloir annuler ce rendez-vous ?
                Cette action est irréversible.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Retour
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                >
                  Confirmer l&apos;annulation
                </Button>
              </div>
            </>
          )}

          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-gray-600">Annulation en cours…</p>
            </div>
          )}

          {status === "cancelled" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-semibold text-gray-800">
                Rendez-vous annulé avec succès
              </p>
              <p className="text-sm text-gray-500">
                Un email de confirmation vous a été envoyé.
              </p>
            </div>
          )}

          {status === "already_cancelled" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <XCircle className="h-10 w-10 text-orange-400" />
              <p className="font-semibold text-gray-800">
                Ce rendez-vous est déjà annulé
              </p>
            </div>
          )}

          {status === "not_found" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <XCircle className="h-10 w-10 text-red-400" />
              <p className="font-semibold text-gray-800">
                Rendez-vous introuvable
              </p>
              <p className="text-sm text-gray-500">
                Le lien est peut-être expiré ou invalide.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <XCircle className="h-10 w-10 text-red-500" />
              <p className="font-semibold text-gray-800">
                Une erreur est survenue
              </p>
              <Button variant="outline" onClick={handleCancel}>
                Réessayer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
