"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ClientSearchAssistant from "@/components/client-search-assistant"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, MapPin, Star, Clock, Calendar, Filter, 
  ChevronDown, Heart, Phone, Mail, ExternalLink,
  Users, TrendingUp, Award, CheckCircle
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
  email?: string
  telephone?: string
  tarifMoyen?: number
  noteMoyenne?: number
  totalAvis?: number
  verification: boolean
  eventTypes: Array<{
    id: string
    titre: string
    duree: number
    prix: number
  }>
  nextDispo?: string
}

const CATEGORIES = [
  { id: "sante", label: "Santé & Bien-être", icon: "🏥" },
  { id: "beaute", label: "Beauté & Esthétique", icon: "💇" },
  { id: "coaching", label: "Coaching & Développement", icon: "🎯" },
  { id: "consulting", label: "Consulting & Conseil", icon: "💼" },
  { id: "sport", label: "Sport & Fitness", icon: "💪" },
  { id: "education", label: "Éducation & Formation", icon: "📚" },
  { id: "creatif", label: "Créatif & Artistique", icon: "🎨" },
  { id: "autre", label: "Autres", icon: "📌" }
]

export default function RecherchePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [sortBy, setSortBy] = useState("pertinence")
  const [showFilters, setShowFilters] = useState(false)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(false)
  const [savedPros, setSavedPros] = useState<Set<string>>(new Set())
  const [openContact, setOpenContact] = useState<string | null>(null)

  const handleAICategory = (category: string) => {
    setSelectedCategory(category)
  }

  useEffect(() => {
    const handleClickOutside = () => setOpenContact(null)
    if (openContact) document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [openContact])

  // Charger les vrais professionnels depuis l'API
  useEffect(() => {
    const fetchProfessionals = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: searchTerm,
          category: selectedCategory || '',
          minPrice: priceRange[0].toString(),
          maxPrice: priceRange[1].toString(),
          sortBy
        })
        
        const response = await fetch(`/api/professionnels/search?${params}`)
        const data = await response.json()
        
        if (response.ok) {
          setProfessionals(data.professionals || [])
        } else {
          console.error('API error:', data.error)
        }
      } catch (error) {
        console.error('Fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfessionals()
  }, [searchTerm, selectedCategory, priceRange, sortBy])

  const filteredPros = professionals.filter(pro => {
    const matchesPrice = !priceRange ||
      (pro.tarifMoyen !== null && pro.tarifMoyen !== undefined && pro.tarifMoyen >= priceRange[0] && pro.tarifMoyen <= priceRange[1])
    return matchesPrice
  })
  
  const toggleSavePro = (proId: string) => {
    setSavedPros(prev => {
      const newSet = new Set(prev)
      if (newSet.has(proId)) {
        newSet.delete(proId)
      } else {
        newSet.add(proId)
      }
      return newSet
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Trouvez le professionnel parfait
            </h1>
            <p className="text-xl mb-8 text-indigo-100">
              Des milliers d'experts vérifiés à portée de clic
            </p>
            
            {/* Barre de recherche principale */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-2 flex items-center">
                <Search className="w-6 h-6 text-gray-400 ml-4" />
                <input
                  type="text"
                  placeholder="Rechercher un professionnel, une spécialité..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none text-lg"
                />
                <Button className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-xl text-white font-semibold">
                  Rechercher
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et résultats */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filtres */}
          <div className="lg:w-80">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Filtres</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>

              {/* Catégories */}
              <div className="mb-8">
                <h4 className="font-medium mb-4">Catégories</h4>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all ${
                        selectedCategory === cat.id
                          ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-300"
                          : "bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100"
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div>{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prix */}
              <div className="mb-8">
                <h4 className="font-medium mb-4">Prix moyen</h4>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{priceRange[0]}€</span>
                    <span>{priceRange[1]}€</span>
                  </div>
                </div>
              </div>

              {/* Tri */}
              <div>
                <h4 className="font-medium mb-4">Trier par</h4>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl"
                >
                  <option value="pertinence">Pertinence</option>
                  <option value="note">Meilleures notes</option>
                  <option value="prix">Prix croissant</option>
                  <option value="dispo">Plus disponible</option>
                </select>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="flex-1">
            {/* Header résultats */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredPros.length} professionnel{filteredPros.length > 1 ? 's' : ''} trouvé{filteredPros.length > 1 ? 's' : ''}
                </h2>
                <p className="text-gray-600 mt-1">
                  {searchTerm && `pour "${searchTerm}"`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="px-4 py-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  France entière
                </Badge>
              </div>
            </div>

            {/* Cartes professionnels */}
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-4 text-gray-600">Chargement des professionnels...</p>
                </div>
              ) : filteredPros.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Aucun résultat trouvé
                  </h3>
                  <p className="text-gray-600">
                    Essayez d'ajuster vos filtres ou votre recherche
                  </p>
                </div>
              ) : (
                filteredPros.map(pro => (
                  <Card key={pro.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Photo et infos principales */}
                        <div className="flex gap-4">
                          <div className="relative">
                            <Avatar className="w-24 h-24">
                              <AvatarImage src={pro.photo} alt={`${pro.prenom} ${pro.nom}`} />
                              <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-600">
                                {pro.prenom[0]}{pro.nom[0]}
                              </AvatarFallback>
                            </Avatar>
                            {pro.verification && (
                              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                  {pro.prenom} {pro.nom}
                                </h3>
                                <p className="text-indigo-600 font-medium mb-2">{pro.specialite}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {pro.ville}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span className="font-medium">{pro.noteMoyenne}</span>
                                    <span>({pro.totalAvis} avis)</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleSavePro(pro.id)}
                                className="p-2 rounded-full hover:bg-gray-100"
                              >
                                <Heart 
                                  className={`w-5 h-5 ${savedPros.has(pro.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                                />
                              </button>
                            </div>
                            <p className="text-gray-600 line-clamp-2 mb-4">{pro.bio}</p>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {pro.eventTypes.slice(0, 3).map(type => (
                                <Badge key={type.id} variant="secondary" className="text-xs">
                                  {type.titre}
                                </Badge>
                              ))}
                              {pro.eventTypes.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{pro.eventTypes.length - 3}
                                </Badge>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button 
                                onClick={() => router.push(`/professionnel/${pro.username}`)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                Voir les RDV
                              </Button>
                              <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => setOpenContact(openContact === pro.id ? null : pro.id)}
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  Contacter
                                  <ChevronDown className="w-4 h-4 ml-2" />
                                </Button>
                                {openContact === pro.id && (
                                  <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {pro.telephone ? (
                                      <a
                                        href={`tel:${pro.telephone}`}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors"
                                        onClick={() => setOpenContact(null)}
                                      >
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                          <Phone className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">Appeler</p>
                                          <p className="text-xs text-gray-500">{pro.telephone}</p>
                                        </div>
                                      </a>
                                    ) : (
                                      <div className="flex items-center gap-3 px-4 py-3 opacity-40 cursor-not-allowed">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                          <Phone className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-500">Téléphone non renseigné</p>
                                        </div>
                                      </div>
                                    )}
                                    <div className="border-t border-gray-100" />
                                    <button
                                      className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors w-full text-left"
                                      onClick={() => {
                                        setOpenContact(null)
                                        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(pro.email || '')}`, '_blank')
                                      }}
                                    >
                                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <Mail className="w-4 h-4 text-indigo-600" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">Envoyer un email</p>
                                        <p className="text-xs text-gray-500">{pro.email}</p>
                                      </div>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Prochaine disponibilité */}
                        {pro.nextDispo && (
                          <div className="lg:border-l lg:pl-6 lg:ml-6">
                            <div className="bg-green-50 rounded-xl p-4">
                              <div className="flex items-center gap-2 text-green-700 mb-2">
                                <Clock className="w-5 h-5" />
                                <span className="font-medium">Prochaine disponibilité</span>
                              </div>
                              <div className="text-green-900 font-semibold">
                                {new Date(pro.nextDispo).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <ClientSearchAssistant onApplyCategory={handleAICategory} />
    </div>
  )
}
