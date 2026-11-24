import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Criar Conta — AuraStudio",
  description: "Cadastre-se no AuraStudio e comece a criar layouts com IA e agendar publicações.",
};

export default async function CadastroPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/");
  }

  return <AuthForm mode="register" />;
}
