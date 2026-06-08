import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const FROM_EMAIL = process.env.GMAIL_USER || "noreply@rendezpro.fr"

async function sendEmail(to: string, subject: string, html: string) {
  return transporter.sendMail({
    from: `"RendezPro" <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  })
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

interface BookingEmailData {
  clientNom: string
  clientEmail: string
  clientTel?: string | null
  clientMsg?: string | null
  proNom: string
  proPrenom: string
  eventTypeTitle: string
  date: Date
  bookingId: string
}

export async function sendBookingConfirmationToClient(data: BookingEmailData) {
  const cancelUrl = `${process.env.NEXTAUTH_URL}/booking/cancel/${data.bookingId}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #6366f1; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">✅ Rendez-vous confirmé</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p>Bonjour <strong>${data.clientNom}</strong>,</p>
        <p>Votre rendez-vous a bien été enregistré. Voici le récapitulatif :</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280; width: 40%;">Professionnel</td>
            <td style="padding: 10px 0; font-weight: bold;">${data.proPrenom} ${data.proNom}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Type de rendez-vous</td>
            <td style="padding: 10px 0; font-weight: bold;">${data.eventTypeTitle}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Date</td>
            <td style="padding: 10px 0; font-weight: bold;">${formatDate(data.date)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280;">Heure</td>
            <td style="padding: 10px 0; font-weight: bold;">${formatTime(data.date)}</td>
          </tr>
        </table>

        <div style="margin-top: 24px;">
          <a href="${cancelUrl}" style="color: #ef4444; font-size: 14px; text-decoration: underline;">
            Annuler ce rendez-vous
          </a>
        </div>

        <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">
          Si vous avez des questions, contactez directement le professionnel.
        </p>
      </div>
    </div>
  `

  return sendEmail(
    data.clientEmail,
    `Confirmation de votre rendez-vous — ${data.eventTypeTitle}`,
    html
  )
}

export async function sendBookingNotificationToPro(
  data: BookingEmailData,
  proEmail: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #6366f1; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">📅 Nouveau rendez-vous</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p>Bonjour <strong>${data.proPrenom} ${data.proNom}</strong>,</p>
        <p>Un nouveau rendez-vous a été pris sur votre agenda :</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280; width: 40%;">Client</td>
            <td style="padding: 10px 0; font-weight: bold;">${data.clientNom}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Email</td>
            <td style="padding: 10px 0;">${data.clientEmail}</td>
          </tr>
          ${data.clientTel ? `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Téléphone</td>
            <td style="padding: 10px 0;">${data.clientTel}</td>
          </tr>` : ""}
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Type de rendez-vous</td>
            <td style="padding: 10px 0; font-weight: bold;">${data.eventTypeTitle}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Date</td>
            <td style="padding: 10px 0; font-weight: bold;">${formatDate(data.date)}</td>
          </tr>
          <tr ${data.clientMsg ? 'style="border-bottom: 1px solid #e5e7eb;"' : ""}>
            <td style="padding: 10px 0; color: #6b7280;">Heure</td>
            <td style="padding: 10px 0; font-weight: bold;">${formatTime(data.date)}</td>
          </tr>
          ${data.clientMsg ? `
          <tr>
            <td style="padding: 10px 0; color: #6b7280;">Message</td>
            <td style="padding: 10px 0; font-style: italic;">${data.clientMsg}</td>
          </tr>` : ""}
        </table>

        <div style="margin-top: 24px; text-align: center;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard/appointments"
            style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Voir mes rendez-vous
          </a>
        </div>
      </div>
    </div>
  `

  return sendEmail(
    proEmail,
    `Nouveau RDV — ${data.clientNom} — ${formatDate(data.date)} à ${formatTime(data.date)}`,
    html
  )
}

interface MultiSlotEmailData {
  clientNom: string
  clientEmail: string
  clientTel?: string | null
  clientMsg?: string | null
  proNom: string
  proPrenom: string
  proEmail: string
  eventTypeTitle: string
  slots: Array<{ date: Date; dateFin?: Date; bookingId: string }>
}

export async function sendMultiSlotConfirmationToClient(data: MultiSlotEmailData) {
  const slotsRows = data.slots
    .map((s, i) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 8px 0; color: #6b7280; width: 40%;">Créneau ${i + 1}</td>
        <td style="padding: 8px 0; font-weight: bold;">
          ${formatDate(s.date)} de ${formatTime(s.date)}${s.dateFin ? ` à ${formatTime(s.dateFin)}` : ''}
        </td>
      </tr>`)
    .join("")

  const cancelLinks = data.slots
    .map(s => `<a href="${process.env.NEXTAUTH_URL}/booking/cancel/${s.bookingId}"
        style="display:block; color: #ef4444; font-size: 13px; text-decoration: underline; margin-bottom: 4px;">
        Annuler le créneau du ${formatDate(s.date)} à ${formatTime(s.date)}${s.dateFin ? ` (fin ${formatTime(s.dateFin)})` : ''}
      </a>`)
    .join("")

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #6366f1; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">✅ Réservation confirmée — ${data.slots.length} créneau${data.slots.length > 1 ? 'x' : ''}</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p>Bonjour <strong>${data.clientNom}</strong>,</p>
        <p>Votre réservation a bien été enregistrée. Voici le récapitulatif de vos <strong>${data.slots.length} créneau${data.slots.length > 1 ? 'x' : ''}</strong> :</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280; width: 40%;">Professionnel</td>
            <td style="padding: 10px 0; font-weight: bold;">${data.proPrenom} ${data.proNom}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Type de rendez-vous</td>
            <td style="padding: 10px 0; font-weight: bold;">${data.eventTypeTitle}</td>
          </tr>
          ${slotsRows}
        </table>

        <div style="margin-top: 24px;">
          ${cancelLinks}
        </div>

        <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">
          Si vous avez des questions, contactez directement le professionnel.
        </p>
      </div>
    </div>
  `

  return sendEmail(
    data.clientEmail,
    `Confirmation — ${data.slots.length} créneau${data.slots.length > 1 ? 'x' : ''} réservé${data.slots.length > 1 ? 's' : ''} — ${data.eventTypeTitle}`,
    html
  )
}

export async function sendMultiSlotNotificationToPro(data: MultiSlotEmailData) {
  const slotsRows = data.slots
    .map((s, i) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 8px 0; color: #6b7280; width: 40%;">Créneau ${i + 1}</td>
        <td style="padding: 8px 0; font-weight: bold;">
          ${formatDate(s.date)} de ${formatTime(s.date)}${s.dateFin ? ` à ${formatTime(s.dateFin)}` : ''}
        </td>
      </tr>`)
    .join("")

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #6366f1; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">📅 Nouvelle réservation — ${data.slots.length} créneau${data.slots.length > 1 ? 'x' : ''}</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p>Bonjour <strong>${data.proPrenom} ${data.proNom}</strong>,</p>
        <p><strong>${data.clientNom}</strong> vient de réserver <strong>${data.slots.length} créneau${data.slots.length > 1 ? 'x' : ''}</strong> :</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280; width: 40%;">Client</td>
            <td style="padding: 10px 0; font-weight: bold;">${data.clientNom}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Email</td>
            <td style="padding: 10px 0;">${data.clientEmail}</td>
          </tr>
          ${data.clientTel ? `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Téléphone</td>
            <td style="padding: 10px 0;">${data.clientTel}</td>
          </tr>` : ""}
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Type de rendez-vous</td>
            <td style="padding: 10px 0; font-weight: bold;">${data.eventTypeTitle}</td>
          </tr>
          ${slotsRows}
          ${data.clientMsg ? `
          <tr>
            <td style="padding: 10px 0; color: #6b7280;">Message</td>
            <td style="padding: 10px 0; font-style: italic;">${data.clientMsg}</td>
          </tr>` : ""}
        </table>

        <div style="margin-top: 24px; text-align: center;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard/appointments"
            style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Voir mes rendez-vous
          </a>
        </div>
      </div>
    </div>
  `

  return sendEmail(
    data.proEmail,
    `Nouveau RDV — ${data.clientNom} — ${data.slots.length} créneau${data.slots.length > 1 ? 'x' : ''} — ${data.eventTypeTitle}`,
    html
  )
}

export async function sendCancellationEmail(data: {
  clientNom: string
  clientEmail: string
  eventTypeTitle: string
  date: Date
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #ef4444; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">❌ Rendez-vous annulé</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p>Bonjour <strong>${data.clientNom}</strong>,</p>
        <p>Votre rendez-vous a bien été annulé :</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280; width: 40%;">Type</td>
            <td style="padding: 10px 0; font-weight: bold;">${data.eventTypeTitle}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">Date</td>
            <td style="padding: 10px 0;">${formatDate(data.date)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280;">Heure</td>
            <td style="padding: 10px 0;">${formatTime(data.date)}</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
          Si vous souhaitez prendre un nouveau rendez-vous, vous pouvez le faire à tout moment.
        </p>
      </div>
    </div>
  `

  return sendEmail(
    data.clientEmail,
    `Annulation de votre rendez-vous — ${data.eventTypeTitle}`,
    html
  )
}

export async function sendPasswordResetEmail(data: {
  email: string
  prenom: string
  resetToken: string
}) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${data.resetToken}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #6366f1; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">🔑 Réinitialisation du mot de passe</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p>Bonjour <strong>${data.prenom}</strong>,</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
            style="background: #6366f1; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">
          Ce lien est valable <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
          Ou copiez ce lien dans votre navigateur :<br/>
          <a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a>
        </p>
      </div>
    </div>
  `

  return sendEmail(
    data.email,
    "Réinitialisation de votre mot de passe — RendezPro",
    html
  )
}
