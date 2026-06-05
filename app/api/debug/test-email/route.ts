import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function GET(req: NextRequest) {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD

  console.log("=== DEBUG EMAIL ===")
  console.log("GMAIL_USER:", gmailUser ? `${gmailUser.substring(0, 5)}...` : "❌ NON DÉFINI")
  console.log("GMAIL_APP_PASSWORD:", gmailPass ? `${gmailPass.substring(0, 4)}...` : "❌ NON DÉFINI")

  if (!gmailUser || !gmailPass) {
    return NextResponse.json({
      error: "Variables d'environnement manquantes",
      GMAIL_USER: gmailUser ? "✅ Défini" : "❌ NON DÉFINI",
      GMAIL_APP_PASSWORD: gmailPass ? "✅ Défini" : "❌ NON DÉFINI",
      solution: "Ajoute GMAIL_USER et GMAIL_APP_PASSWORD dans ton fichier .env"
    }, { status: 400 })
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    })

    await transporter.verify()
    console.log("✅ Connexion Gmail OK")

    await transporter.sendMail({
      from: `"RendezPro Test" <${gmailUser}>`,
      to: gmailUser,
      subject: "✅ Test email RendezPro",
      html: "<h1>Test réussi !</h1><p>Votre configuration email fonctionne correctement.</p>",
    })

    return NextResponse.json({
      success: true,
      message: `Email de test envoyé à ${gmailUser}`,
      GMAIL_USER: "✅ Défini",
      GMAIL_APP_PASSWORD: "✅ Défini",
    })
  } catch (error: any) {
    console.error("❌ Erreur email:", error.message)
    return NextResponse.json({
      error: error.message,
      code: error.code,
      GMAIL_USER: "✅ Défini",
      GMAIL_APP_PASSWORD: "✅ Défini",
      conseils: [
        "Vérifie que la validation en 2 étapes est activée sur ton compte Gmail",
        "Assure-toi d'utiliser un 'Mot de passe d'application' (16 caractères sans espaces)",
        "Le compte Gmail ne doit pas avoir de restrictions de sécurité",
      ]
    }, { status: 500 })
  }
}
