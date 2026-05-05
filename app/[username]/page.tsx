import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingFlow from "./BookingFlow";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (!user) return { title: "Page introuvable" };
  return {
    title: `Réserver avec ${user.prenom} ${user.nom} — RendezPro`,
    description: user.bio ?? undefined,
  };
}

export default async function ProfessionalPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      eventTypes: { where: { actif: true }, orderBy: { createdAt: "asc" } },
      availabilities: { where: { actif: true }, orderBy: { jour: "asc" } },
    },
  });

  if (!user) notFound();

  // Serialize for client (DateTime → string)
  const data = {
    user: {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      username: user.username,
      bio: user.bio,
      photo: user.photo,
    },
    eventTypes: user.eventTypes.map((et) => ({
      id: et.id,
      titre: et.titre,
      description: et.description,
      duree: et.duree,
      prix: et.prix,
      lieu: et.lieu,
    })),
    availabilities: user.availabilities.map((a) => ({
      jour: a.jour,
      heureDebut: a.heureDebut,
      heureFin: a.heureFin,
    })),
  };

  return <BookingFlow data={data} />;
}
