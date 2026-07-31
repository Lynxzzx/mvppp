"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PlatformLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/platform/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: f.get("username"),
        password: f.get("password"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Falha no login");
      return;
    }
    router.push("/sysadmin");
    router.refresh();
  }

  return (
    <div className="dark relative flex min-h-dvh flex-col items-center justify-center bg-[#0c0a09] px-4 text-[#fafaf9]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 50% at 50% -8%, rgba(231,194,122,0.10), transparent 50%), linear-gradient(180deg, #1c1917 0%, #0c0a09 45%, #0c0a09 100%)",
        }}
        aria-hidden
      />
      <div className="relative mb-9">
        <BrandLogo forceTheme="dark" size={36} className="text-2xl text-[#fafaf9]" />
      </div>
      <Card className="relative w-full max-w-sm animate-enter border-white/10 bg-[#141210] text-[#fafaf9] shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-xl font-medium tracking-tight text-[#fafaf9]">
            Painel da plataforma
          </CardTitle>
          <CardDescription className="text-[#a8a29e]">
            Acesso restrito à operação Veluxa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input id="username" name="username" required autoComplete="username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
