import { useEffect, useState } from "react";
import { MemberHeader } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  UserPlus, Users, CheckCircle, XCircle,
  DollarSign, FolderKanban, Plus, Trash2, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface MemberRow {
  id: string;
  full_name: string;
  phone: string | null;
  active: boolean;
}

interface FinancialRow {
  id: string;
  month: string;
  year: number;
  receita: number;
  despesa: number;
}

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const PROJECT_STATUSES = ["Planejamento", "Em andamento", "Concluído"];

export default function AdminPage() {
  const { session } = useAuth();

  // Members state
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberForm, setMemberForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [submittingMember, setSubmittingMember] = useState(false);

  // Financial state
  const [financials, setFinancials] = useState<FinancialRow[]>([]);
  const [showFinancialDialog, setShowFinancialDialog] = useState(false);
  const [editingFinancial, setEditingFinancial] = useState<FinancialRow | null>(null);
  const [financialForm, setFinancialForm] = useState({ month: "Janeiro", year: new Date().getFullYear(), receita: 0, despesa: 0 });
  const [submittingFinancial, setSubmittingFinancial] = useState(false);

  // Projects state
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", status: "Planejamento", progress: 0 });
  const [submittingProject, setSubmittingProject] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [membersRes, financialsRes, projectsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, active"),
      supabase.from("financial_reports").select("*").order("year", { ascending: false }).order("month", { ascending: true }),
      supabase.from("church_projects").select("*").order("created_at", { ascending: false }),
    ]);
    setMembers(membersRes.data || []);
    setFinancials(financialsRes.data || []);
    setProjects(projectsRes.data || []);
    setLoading(false);
  };

  // ─── Members ───────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.email || !memberForm.password || !memberForm.full_name) return;
    setSubmittingMember(true);
    const { data, error } = await supabase.functions.invoke("register-member", { body: memberForm });
    setSubmittingMember(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Erro ao cadastrar");
    } else {
      toast.success("Membro cadastrado com sucesso!");
      setMemberForm({ email: "", password: "", full_name: "", phone: "" });
      setShowMemberForm(false);
      fetchAll();
    }
  };

  const toggleActive = async (userId: string, active: boolean) => {
    const { data, error } = await supabase.functions.invoke("toggle-member", { body: { user_id: userId, active } });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Erro ao atualizar");
    } else {
      toast.success(active ? "Membro ativado!" : "Membro desativado!");
      fetchAll();
    }
  };

  // ─── Financial Reports ─────────────────────────────
  const openFinancialDialog = (row?: FinancialRow) => {
    if (row) {
      setEditingFinancial(row);
      setFinancialForm({ month: row.month, year: row.year, receita: row.receita, despesa: row.despesa });
    } else {
      setEditingFinancial(null);
      setFinancialForm({ month: "Janeiro", year: new Date().getFullYear(), receita: 0, despesa: 0 });
    }
    setShowFinancialDialog(true);
  };

  const handleFinancialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFinancial(true);
    if (editingFinancial) {
      const { error } = await supabase.from("financial_reports").update({
        month: financialForm.month,
        year: financialForm.year,
        receita: financialForm.receita,
        despesa: financialForm.despesa,
      }).eq("id", editingFinancial.id);
      if (error) toast.error("Erro ao atualizar: " + error.message);
      else toast.success("Relatório atualizado!");
    } else {
      const { error } = await supabase.from("financial_reports").insert({
        month: financialForm.month,
        year: financialForm.year,
        receita: financialForm.receita,
        despesa: financialForm.despesa,
      });
      if (error) toast.error("Erro ao criar: " + error.message);
      else toast.success("Relatório adicionado!");
    }
    setSubmittingFinancial(false);
    setShowFinancialDialog(false);
    fetchAll();
  };

  const deleteFinancial = async (id: string) => {
    const { error } = await supabase.from("financial_reports").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else { toast.success("Relatório excluído!"); fetchAll(); }
  };

  // ─── Projects ──────────────────────────────────────
  const openProjectDialog = (row?: ProjectRow) => {
    if (row) {
      setEditingProject(row);
      setProjectForm({ name: row.name, description: row.description || "", status: row.status, progress: row.progress });
    } else {
      setEditingProject(null);
      setProjectForm({ name: "", description: "", status: "Planejamento", progress: 0 });
    }
    setShowProjectDialog(true);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name) return;
    setSubmittingProject(true);
    if (editingProject) {
      const { error } = await supabase.from("church_projects").update({
        name: projectForm.name,
        description: projectForm.description || null,
        status: projectForm.status,
        progress: projectForm.progress,
      }).eq("id", editingProject.id);
      if (error) toast.error("Erro ao atualizar: " + error.message);
      else toast.success("Projeto atualizado!");
    } else {
      const { error } = await supabase.from("church_projects").insert({
        name: projectForm.name,
        description: projectForm.description || null,
        status: projectForm.status,
        progress: projectForm.progress,
      });
      if (error) toast.error("Erro ao criar: " + error.message);
      else toast.success("Projeto criado!");
    }
    setSubmittingProject(false);
    setShowProjectDialog(false);
    fetchAll();
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("church_projects").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else { toast.success("Projeto excluído!"); fetchAll(); }
  };

  // ─── Render ────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <MemberHeader />
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-sans font-bold">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">Gerencie membros, finanças e projetos da igreja.</p>
        </div>

        <Tabs defaultValue="membros" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="membros" className="gap-1.5">
              <Users className="h-4 w-4" /> Membros
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-1.5">
              <DollarSign className="h-4 w-4" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="projetos" className="gap-1.5">
              <FolderKanban className="h-4 w-4" /> Projetos
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB: MEMBROS ─── */}
          <TabsContent value="membros">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowMemberForm(!showMemberForm)} className="gap-1.5">
                <UserPlus className="h-4 w-4" /> Novo Membro
              </Button>
            </div>

            {showMemberForm && (
              <Card className="mb-6">
                <CardHeader><CardTitle className="font-sans text-lg">Cadastrar Novo Membro</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="grid gap-4 sm:grid-cols-2">
                    <Input placeholder="Nome completo *" value={memberForm.full_name} onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })} required />
                    <Input type="email" placeholder="Email *" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} required />
                    <Input type="password" placeholder="Senha *" value={memberForm.password} onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })} required minLength={6} />
                    <Input placeholder="Telefone" value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} />
                    <div className="sm:col-span-2 flex gap-2">
                      <Button type="submit" disabled={submittingMember}>{submittingMember ? "Cadastrando..." : "Cadastrar Membro"}</Button>
                      <Button type="button" variant="outline" onClick={() => setShowMemberForm(false)}>Cancelar</Button>
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
                              <Badge variant={m.active ? "default" : "destructive"}>{m.active ? "Ativo" : "Inativo"}</Badge>
                            </td>
                            <td className="py-3 text-right">
                              <Button size="sm" variant={m.active ? "outline" : "default"} onClick={() => toggleActive(m.id, !m.active)} className="gap-1">
                                {m.active ? (<><XCircle className="h-3.5 w-3.5" /> Desativar</>) : (<><CheckCircle className="h-3.5 w-3.5" /> Ativar</>)}
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
          </TabsContent>

          {/* ─── TAB: FINANCEIRO ─── */}
          <TabsContent value="financeiro">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openFinancialDialog()} className="gap-1.5">
                <Plus className="h-4 w-4" /> Novo Relatório
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-sans flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Relatórios Financeiros ({financials.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {financials.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum relatório cadastrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 font-semibold">Período</th>
                          <th className="text-right py-3 font-semibold">Receita</th>
                          <th className="text-right py-3 font-semibold">Despesa</th>
                          <th className="text-right py-3 font-semibold">Saldo</th>
                          <th className="text-right py-3 font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financials.map((f) => (
                          <tr key={f.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 font-medium">{f.month}/{f.year}</td>
                            <td className="py-3 text-right text-green-600 dark:text-green-400 font-medium">R$ {Number(f.receita).toLocaleString("pt-BR")}</td>
                            <td className="py-3 text-right text-destructive font-medium">R$ {Number(f.despesa).toLocaleString("pt-BR")}</td>
                            <td className="py-3 text-right font-bold">R$ {(Number(f.receita) - Number(f.despesa)).toLocaleString("pt-BR")}</td>
                            <td className="py-3 text-right space-x-1">
                              <Button size="icon" variant="ghost" onClick={() => openFinancialDialog(f)}><Pencil className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteFinancial(f.id)}><Trash2 className="h-4 w-4" /></Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={showFinancialDialog} onOpenChange={setShowFinancialDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingFinancial ? "Editar Relatório" : "Novo Relatório Financeiro"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFinancialSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mês</label>
                      <Select value={financialForm.month} onValueChange={(v) => setFinancialForm({ ...financialForm, month: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ano</label>
                      <Input type="number" value={financialForm.year} onChange={(e) => setFinancialForm({ ...financialForm, year: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Receita (R$)</label>
                      <Input type="number" step="0.01" value={financialForm.receita} onChange={(e) => setFinancialForm({ ...financialForm, receita: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Despesa (R$)</label>
                      <Input type="number" step="0.01" value={financialForm.despesa} onChange={(e) => setFinancialForm({ ...financialForm, despesa: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={submittingFinancial}>{submittingFinancial ? "Salvando..." : "Salvar"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ─── TAB: PROJETOS ─── */}
          <TabsContent value="projetos">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openProjectDialog()} className="gap-1.5">
                <Plus className="h-4 w-4" /> Novo Projeto
              </Button>
            </div>

            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto cadastrado.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-sans font-bold">{p.name}</h3>
                        <div className="flex items-center gap-1">
                          <Badge variant={p.status === "Concluído" ? "default" : p.status === "Em andamento" ? "secondary" : "outline"}>
                            {p.status}
                          </Badge>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openProjectDialog(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteProject(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      {p.description && <p className="text-sm text-muted-foreground mb-4">{p.description}</p>}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-semibold">{p.progress}%</span>
                        </div>
                        <Progress value={p.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProject ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProjectSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome *</label>
                    <Input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={projectForm.status} onValueChange={(v) => setProjectForm({ ...projectForm, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Progresso (%)</label>
                      <Input type="number" min={0} max={100} value={projectForm.progress} onChange={(e) => setProjectForm({ ...projectForm, progress: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={submittingProject}>{submittingProject ? "Salvando..." : "Salvar"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
