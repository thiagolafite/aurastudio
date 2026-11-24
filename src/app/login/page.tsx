import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Entrar — AuraStudio",
  description: "Acesse sua conta no AuraStudio para gerenciar clientes, layouts e agendamentos.",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/");
  }

  return <AuthForm mode="login" />;
}
