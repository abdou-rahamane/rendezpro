CREATE TABLE "EventTypeSlot" (
    "id" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventTypeSlot_pkey" PRIMARY KEY ("id")
);

-- Créer un index pour de meilleures performances
CREATE INDEX "EventTypeSlot_eventTypeId_idx" ON "EventTypeSlot"("eventTypeId");
CREATE INDEX "EventTypeSlot_dateDebut_idx" ON "EventTypeSlot"("dateDebut");
