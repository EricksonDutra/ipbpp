import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

type Escala = {
  id: string;
  funcao: string;
  data: string;
  horario: string;
  responsavel_id: string;
  observacoes: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
};

const FUNCAO_LABELS: Record<string, string> = {
  recepcao: "Recepção",
  midias: "Mídias",
  diaconia: "Diaconia",
  liturgia: "Liturgia",
  ebd: "EBD",
  pregacao: "Pregação",
};

const FUNCAO_COLORS: Record<string, string> = {
  recepcao: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  midias: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  diaconia: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  liturgia: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  ebd: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  pregacao: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
};

// Map roles to the funcoes they can manage
const ROLE_FUNCAO_MAP: Record<string, string[]> = {
  admin: Object.keys(FUNCAO_LABELS),
  gestor_midias: ["midias"],
  pastor: ["ebd", "liturgia", "pregacao"],
  diacono: ["diaconia"],
  presidente_sociedade: ["recepcao"],
};

function getManageableFuncoes(roles: string[]): string[] {
  const funcoes = new Set<string>();
  for (const role of roles) {
    const allowed = ROLE_FUNCAO_MAP[role];
    if (allowed) allowed.forEach((f) => funcoes.add(f));
  }
  return Array.from(funcoes);
}

export function EscalasTab() {
  const { isAdmin, roles } = useAuth();
  const manageableFuncoes = getManageableFuncoes(roles);
  const canManage = manageableFuncoes.length > 0;
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [members, setMembers] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    funcao: manageableFuncoes[0] || "recepcao",
    data: "",
    horario: "09:00",
    responsavel_id: "",
    observacoes: "",
  });

  useEffect(() => {
    fetchEscalas();
    if (canManage) fetchMembers();
  }, [canManage]);

  const fetchEscalas = async () => {
    // Fetch escalas with responsavel profile name
    const { data, error } = await supabase
      .from("escalas")
      .select("*, profiles:responsavel_id(full_name)")
      .gte("data", new Date().toISOString().split("T")[0])
      .order("data", { ascending: true })
      .order("horario", { ascending: true });

    if (!error && data) {
      setEscalas(data as any);
    }
    setLoading(false);
  };

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("active", true)
      .order("full_name");
    if (data) setMembers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.data || !form.responsavel_id) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("escalas")
        .update({
          funcao: form.funcao as any,
          data: form.data,
          horario: form.horario,
          responsavel_id: form.responsavel_id,
          observacoes: form.observacoes || null,
        })
        .eq("id", editingId);

      if (error) {
        if (error.code === "23505") {
          toast.error("Conflito: essa pessoa já está escalada neste dia/horário para outra função.");
        } else {
          toast.error("Erro ao atualizar: " + error.message);
        }
        return;
      }
      toast.success("Escala atualizada!");
    } else {
      const { error } = await supabase.from("escalas").insert({
        funcao: form.funcao as any,
        data: form.data,
        horario: form.horario,
        responsavel_id: form.responsavel_id,
        observacoes: form.observacoes || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Conflito: essa pessoa já está escalada neste dia/horário para outra função.");
        } else {
          toast.error("Erro ao criar escala: " + error.message);
        }
        return;
      }
      toast.success("Escala criada!");
    }

    resetForm();
    fetchEscalas();
  };

  const handleEdit = (escala: Escala) => {
    setForm({
      funcao: escala.funcao,
      data: escala.data,
      horario: escala.horario,
      responsavel_id: escala.responsavel_id,
      observacoes: escala.observacoes || "",
    });
    setEditingId(escala.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("escalas").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover escala.");
    } else {
      toast.success("Escala removida.");
      fetchEscalas();
    }
  };

  const resetForm = () => {
    setForm({ funcao: "recepcao", data: "", horario: "09:00", responsavel_id: "", observacoes: "" });
    setEditingId(null);
    setShowForm(false);
  };

  // Group by date
  const grouped = escalas.reduce<Record<string, Escala[]>>((acc, e) => {
    (acc[e.data] = acc[e.data] || []).push(e);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-sans font-bold text-lg">Escalas de Serviço</h3>
          <p className="text-sm text-muted-foreground">Confira quem está escalado para cada função.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { showForm ? resetForm() : setShowForm(true); }} variant={showForm ? "outline" : "default"} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> {showForm ? "Cancelar" : "Nova Escala"}
          </Button>
        )}
      </div>

      {isAdmin && showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-base">{editingId ? "Editar Escala" : "Nova Escala"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Função *</label>
                <Select value={form.funcao} onValueChange={(v) => setForm({ ...form, funcao: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FUNCAO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Responsável *</label>
                <Select value={form.responsavel_id} onValueChange={(v) => setForm({ ...form, responsavel_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data *</label>
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Horário</label>
                <Input type="time" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  placeholder="Informações adicionais..."
                  rows={2}
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" className="gap-1.5">
                  {editingId ? "Salvar Alterações" : "Criar Escala"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma escala futura cadastrada.</p>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <Card key={date}>
            <CardHeader className="pb-3">
              <CardTitle className="font-sans text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge className={`shrink-0 text-xs font-medium ${FUNCAO_COLORS[e.funcao] || ""}`}>
                        {FUNCAO_LABELS[e.funcao] || e.funcao}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{(e as any).profiles?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{e.horario}</p>
                        {e.observacoes && <p className="text-xs text-muted-foreground truncate">{e.observacoes}</p>}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(e)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
