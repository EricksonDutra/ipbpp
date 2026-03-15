import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error("Erro ao redefinir senha: " + error.message);
    } else {
      toast.success("Senha redefinida com sucesso!");
      navigate("/dashboard", { replace: true });
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center py-16 px-4 bg-section-warm">
          <Card className="w-full max-w-md shadow-lg text-center">
            <CardHeader>
              <CardTitle className="font-sans text-xl">Link inválido</CardTitle>
              <CardDescription>
                Este link de redefinição de senha é inválido ou expirou. Solicite um novo link na tela de login.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/membros")} className="w-full">
                Voltar ao Login
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center py-16 px-4 bg-section-warm">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-sans text-2xl">Redefinir Senha</CardTitle>
            <CardDescription>
              Digite sua nova senha abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={8}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
