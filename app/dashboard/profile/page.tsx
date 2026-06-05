"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  Calendar, Clock, Home, CalendarDays, UserCheck,
  FileText, BarChart3, Link2, Settings, Menu,
  User, Save, ExternalLink, Loader2, Upload, X,
} from "lucide-react"

const navigationItems = [
  { name: "Tableau de bord", icon: Home, href: "/dashboard" },
  { name: "Calendrier", icon: CalendarDays, href: "/dashboard/calendar" },
  { name: "Rendez-vous", icon: UserCheck, href: "/dashboard/appointments" },
  { name: "Types de RDV", icon: FileText, href: "/dashboard/appointment-types" },
  { name: "Disponibilités", icon: Clock, href: "/dashboard/availability" },
  { name: "Profil", icon: Settings, href: "/dashboard/profile", active: true },
]

const CATEGORIES = [
  { id: "sante", label: "Santé & Bien-être" },
  { id: "beaute", label: "Beauté & Esthétique" },
  { id: "coaching", label: "Coaching & Développement" },
  { id: "consulting", label: "Consulting & Conseil" },
  { id: "sport", label: "Sport & Fitness" },
  { id: "education", label: "Éducation & Formation" },
  { id: "creatif", label: "Créatif & Artistique" },
  { id: "autre", label: "Autres" },
]

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    bio: "",
    photo: "",
    username: "",
    email: "",
    specialite: "",
    categorie: "",
    telephone: "",
    ville: "",
    codePostal: "",
    pays: "France",
  })

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login")
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          setForm({
            prenom: data.prenom || "",
            nom: data.nom || "",
            bio: data.bio || "",
            photo: data.photo || "",
            username: data.username || "",
            email: data.email || "",
            specialite: data.specialite || "",
            categorie: data.categorie || "",
            telephone: data.telephone || "",
            ville: data.ville || "",
            codePostal: data.codePostal || "",
            pays: data.pays || "France",
          })
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [session])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/profile/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok) {
        setForm((prev) => ({ ...prev, photo: data.url }))
        toast.success("Photo mise à jour !")
      } else {
        toast.error(data.error || "Erreur lors de l'upload")
      }
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          prenom: form.prenom,
          bio: form.bio,
          photo: form.photo,
          username: form.username,
          specialite: form.specialite,
          categorie: form.categorie,
          telephone: form.telephone,
          ville: form.ville,
          codePostal: form.codePostal,
          pays: form.pays,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Profil mis à jour avec succès")
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour")
      }
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const initials = `${form.prenom?.[0] || ""}${form.nom?.[0] || ""}`.toUpperCase()
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${form.username}`

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r transition-all duration-300 flex flex-col flex-shrink-0`}>
        <div className="p-4 border-b flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RendezPro
            </span>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${"active" in item ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b px-8 py-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
              <p className="text-gray-600">Gérez vos informations personnelles et professionnelles</p>
            </div>
          </div>
        </div>

        <div className="p-8 max-w-2xl space-y-6">
          {/* Avatar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={form.photo} alt={initials} />
                    <AvatarFallback className="text-3xl bg-blue-100 text-blue-600">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-lg">
                    {form.prenom} {form.nom}
                  </p>
                  <p className="text-sm text-gray-500">{form.email}</p>
                  {form.username && (
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-indigo-600 hover:underline mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Voir ma page publique
                    </a>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Upload en cours…</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" />Changer la photo</>
                    )}
                  </Button>
                  {form.photo && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, photo: "" }))}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 mt-2"
                    >
                      <X className="w-3 h-3" /> Supprimer la photo
                    </button>
                  )}
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — max 5 Mo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      value={form.prenom}
                      onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username (lien public)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 whitespace-nowrap">rendezpro.fr/</span>
                    <Input
                      id="username"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                      placeholder="mon-username"
                      pattern="[a-z0-9-]+"
                      title="Lettres minuscules, chiffres et tirets uniquement"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Lettres minuscules, chiffres et tirets uniquement.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio professionnelle</Label>
                  <Textarea
                    id="bio"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Décrivez votre activité en quelques mots…"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie d'activité</Label>
                  <select
                    id="categorie"
                    value={form.categorie}
                    onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choisir une catégorie --</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400">Cette catégorie permettra aux clients de vous trouver via les filtres de recherche.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialite">Spécialité</Label>
                    <Input
                      id="specialite"
                      value={form.specialite}
                      onChange={(e) => setForm({ ...form, specialite: e.target.value })}
                      placeholder="Ex: Dermatologie, Coaching..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      value={form.telephone}
                      onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      placeholder="Ex: +33 6 12 34 56 78"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ville">Ville</Label>
                    <Input
                      id="ville"
                      value={form.ville}
                      onChange={(e) => setForm({ ...form, ville: e.target.value })}
                      placeholder="Ex: Paris, Lyon..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codePostal">Code postal</Label>
                    <Input
                      id="codePostal"
                      value={form.codePostal}
                      onChange={(e) => setForm({ ...form, codePostal: e.target.value })}
                      placeholder="75000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pays">Pays</Label>
                    <Input
                      id="pays"
                      value={form.pays}
                      onChange={(e) => setForm({ ...form, pays: e.target.value })}
                      placeholder="France"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={form.email} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-400">L&apos;email ne peut pas être modifié ici.</p>
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement…</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Enregistrer les modifications</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
