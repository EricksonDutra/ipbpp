import { useEffect, useState } from "react";
import { MemberHeader } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface MemberRow {
  id: string;
  full_name: string;
  phone: string | null;
  active: boolean;
}

export default function AdminPage() {
  const { session } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, phone, active");
    setMembers(data || []);
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.full_name) return;
    setSubmitting(true);

    const { data, error } = await supabase.functions.invoke("register-member", {
      body: formData,
    });

    setSubmitting(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Erro ao cadastrar");
    } else {
      toast.success("Membro cadastrado com sucesso!");
      setFormData({ email: "", password: "", full_name: "", phone: "" });
      setShowForm(false);
      fetchMembers();
    }
  };

  const toggleActive = async (userId: string, active: boolean) => {
    const { data, error } = await supabase.functions.invoke("toggle-member", {
      body: { user_id: userId, active },
    });

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Erro ao atualizar");
    } else {
      toast.success(active ? "Membro ativado!" : "Membro desativado!");
      fetchMembers();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <MemberHeader />
      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-sans font-bold">Gerenciar Membros</h1>
            <p className="text-sm text-muted-foreground">Cadastre e gerencie os membros da igreja.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-1.5">
            <UserPlus className="h-4 w-4" /> Novo Membro
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-sans text-lg">Cadastrar Novo Membro</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="grid gap-4 sm:grid-cols-2">
                <Input
                  placeholder="Nome completo *"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  type="password"
                  placeholder="Senha *"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
                <Input
                  placeholder="Telefone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <div className="sm:col-span-2 flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Cadastrando..." : "Cadastrar Membro"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <Users className="h-5 w-5" /> Membros ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum membro cadastrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-semibold">Nome</th>
                      <th className="text-left py-3 font-semibold">Telefone</th>
                      <th className="text-center py-3 font-semibold">Status</th>
                      <th className="text-right py-3 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 font-medium">{m.full_name}</td>
                        <td className="py-3 text-muted-foreground">{m.phone || "—"}</td>
                        <td className="py-3 text-center">
                          <Badge variant={m.active ? "default" : "destructive"}>
                            {m.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            size="sm"
                            variant={m.active ? "outline" : "default"}
                            onClick={() => toggleActive(m.id, !m.active)}
                            className="gap-1"
                          >
                            {m.active ? (
                              <><XCircle className="h-3.5 w-3.5" /> Desativar</>
                            ) : (
                              <><CheckCircle className="h-3.5 w-3.5" /> Ativar</>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
