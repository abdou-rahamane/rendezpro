import Link from "next/link";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            RendezPro
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Page introuvable
          </h1>
          <p className="text-gray-600 mb-8 max-w-sm mx-auto">
            Ce professionnel n'existe pas ou son lien de réservation n'est plus
            actif.
          </p>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
