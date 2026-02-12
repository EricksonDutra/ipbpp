import { useEffect, useState, useRef } from "react";
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
  Upload, FileText, X, HeartHandshake, PartyPopper,
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
  document_url: string | null;
}

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
}

interface VisitorRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  visit_date: string;
  created_at: string;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Projects state
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", status: "Planejamento", progress: 0 });
  const [submittingProject, setSubmittingProject] = useState(false);

  // Visitors state
  const [visitors, setVisitors] = useState<VisitorRow[]>([]);
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [visitorForm, setVisitorForm] = useState({ full_name: "", phone: "", email: "", notes: "", visit_date: new Date().toISOString().split("T")[0] });
  const [submittingVisitor, setSubmittingVisitor] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [lastVisitorName, setLastVisitorName] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [membersRes, financialsRes, projectsRes, visitorsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, active"),
      supabase.from("financial_reports").select("*").order("year", { ascending: false }).order("month", { ascending: true }),
      supabase.from("church_projects").select("*").order("created_at", { ascending: false }),
      supabase.from("visitors").select("*").order("visit_date", { ascending: false }),
    ]);
    setMembers(membersRes.data || []);
    setFinancials(financialsRes.data || []);
    setProjects(projectsRes.data || []);
    setVisitors(visitorsRes.data as VisitorRow[] || []);
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
    setSelectedFile(null);
    setShowFinancialDialog(true);
  };

  const uploadDocument = async (reportId: string): Promise<string | null> => {
    if (!selectedFile) return null;
    const ext = selectedFile.name.split(".").pop();
    const filePath = `${reportId}.${ext}`;

    // Remove old file if exists
    await supabase.storage.from("financial-docs").remove([filePath]);

    const { error } = await supabase.storage
      .from("financial-docs")
      .upload(filePath, selectedFile, { upsert: true });

    if (error) {
      toast.error("Erro ao fazer upload: " + error.message);
      return null;
    }

    // Store the file path, not a public URL (bucket is private)
    return filePath;
  };

  const handleFinancialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFinancial(true);

    if (editingFinancial) {
      let documentUrl = editingFinancial.document_url;

      if (selectedFile) {
        const url = await uploadDocument(editingFinancial.id);
        if (url) documentUrl = url;
      }

      const { error } = await supabase.from("financial_reports").update({
        month: financialForm.month,
        year: financialForm.year,
        receita: financialForm.receita,
        despesa: financialForm.despesa,
        document_url: documentUrl,
      }).eq("id", editingFinancial.id);
      if (error) toast.error("Erro ao atualizar: " + error.message);
      else toast.success("Relatório atualizado!");
    } else {
      // Insert first to get ID, then upload
      const { data: inserted, error } = await supabase.from("financial_reports").insert({
        month: financialForm.month,
        year: financialForm.year,
        receita: financialForm.receita,
        despesa: financialForm.despesa,
      }).select("id").single();

      if (error) {
        toast.error("Erro ao criar: " + error.message);
      } else {
        if (selectedFile && inserted) {
          const url = await uploadDocument(inserted.id);
          if (url) {
            await supabase.from("financial_reports").update({ document_url: url }).eq("id", inserted.id);
          }
        }
        toast.success("Relatório adicionado!");
      }
    }
    setSubmittingFinancial(false);
    setShowFinancialDialog(false);
    setSelectedFile(null);
    fetchAll();
  };

  const removeDocument = async (report: FinancialRow) => {
    if (!report.document_url) return;
    await supabase.storage.from("financial-docs").remove([report.document_url]);
    await supabase.from("financial_reports").update({ document_url: null }).eq("id", report.id);
    toast.success("Documento removido!");
    fetchAll();
  };

  const deleteFinancial = async (id: string) => {
    // Also remove associated file
    const report = financials.find((f) => f.id === id);
    if (report?.document_url) {
      await supabase.storage.from("financial-docs").remove([report.document_url]);
    }
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

  // ─── Visitors ─────────────────────────────────────
  const handleVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorForm.full_name.trim()) return;
    setSubmittingVisitor(true);
    const { error } = await supabase.from("visitors").insert({
      full_name: visitorForm.full_name.trim(),
      phone: visitorForm.phone.trim() || null,
      email: visitorForm.email.trim() || null,
      notes: visitorForm.notes.trim() || null,
      visit_date: visitorForm.visit_date,
    } as any);
    setSubmittingVisitor(false);
    if (error) {
      toast.error("Erro ao cadastrar visitante: " + error.message);
    } else {
      setLastVisitorName(visitorForm.full_name.trim());
      setShowWelcomeDialog(true);
      setVisitorForm({ full_name: "", phone: "", email: "", notes: "", visit_date: new Date().toISOString().split("T")[0] });
      setShowVisitorForm(false);
      fetchAll();
    }
  };

  const deleteVisitor = async (id: string) => {
    const { error } = await supabase.from("visitors").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else { toast.success("Visitante removido!"); fetchAll(); }
  };

  // ─── Render ────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <MemberHeader />
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-sans font-bold">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">Gerencie membros, finanças, projetos e visitantes da igreja.</p>
        </div>

        <Tabs defaultValue="membros" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="membros" className="gap-1.5">
              <Users className="h-4 w-4" /> Membros
            </TabsTrigger>
            <TabsTrigger value="visitantes" className="gap-1.5">
              <HeartHandshake className="h-4 w-4" /> Visitantes
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
                          <th className="text-center py-3 font-semibold">Documento</th>
                          <th className="text-right py-3 font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financials.map((f) => (
                          <tr key={f.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 font-medium">{f.month}/{f.year}</td>
                            <td className="py-3 text-right font-medium">R$ {Number(f.receita).toLocaleString("pt-BR")}</td>
                            <td className="py-3 text-right text-destructive font-medium">R$ {Number(f.despesa).toLocaleString("pt-BR")}</td>
                            <td className="py-3 text-right font-bold">R$ {(Number(f.receita) - Number(f.despesa)).toLocaleString("pt-BR")}</td>
                            <td className="py-3 text-center">
                              {f.document_url ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button size="sm" variant="outline" className="gap-1" onClick={async () => {
                                    const { data } = await supabase.storage.from("financial-docs").createSignedUrl(f.document_url!, 3600);
                                    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                                    else toast.error("Não foi possível abrir o documento.");
                                  }}>
                                    <FileText className="h-3.5 w-3.5" /> Ver
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeDocument(f)}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
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

                  {/* File upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Detalhamento (PDF, imagem, etc.)</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4" /> {selectedFile ? "Trocar arquivo" : "Anexar arquivo"}
                      </Button>
                      {selectedFile && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span className="max-w-[200px] truncate">{selectedFile.name}</span>
                          <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedFile(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {!selectedFile && editingFinancial?.document_url && (
                        <span className="text-xs text-muted-foreground">Documento atual será mantido</span>
                      )}
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

          {/* ─── TAB: VISITANTES ─── */}
          <TabsContent value="visitantes">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowVisitorForm(!showVisitorForm)} className="gap-1.5">
                <UserPlus className="h-4 w-4" /> Novo Visitante
              </Button>
            </div>

            {showVisitorForm && (
              <Card className="mb-6">
                <CardHeader><CardTitle className="font-sans text-lg">Cadastrar Visitante</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleVisitorSubmit} className="grid gap-4 sm:grid-cols-2">
                    <Input placeholder="Nome completo *" value={visitorForm.full_name} onChange={(e) => setVisitorForm({ ...visitorForm, full_name: e.target.value })} required />
                    <Input placeholder="Telefone" value={visitorForm.phone} onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })} />
                    <Input type="email" placeholder="Email" value={visitorForm.email} onChange={(e) => setVisitorForm({ ...visitorForm, email: e.target.value })} />
                    <Input type="date" value={visitorForm.visit_date} onChange={(e) => setVisitorForm({ ...visitorForm, visit_date: e.target.value })} />
                    <div className="sm:col-span-2">
                      <Textarea placeholder="Observações (como conheceu a igreja, pedidos, etc.)" value={visitorForm.notes} onChange={(e) => setVisitorForm({ ...visitorForm, notes: e.target.value })} rows={2} />
                    </div>
                    <div className="sm:col-span-2 flex gap-2">
                      <Button type="submit" disabled={submittingVisitor}>{submittingVisitor ? "Cadastrando..." : "Cadastrar Visitante"}</Button>
                      <Button type="button" variant="outline" onClick={() => setShowVisitorForm(false)}>Cancelar</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="font-sans flex items-center gap-2">
                  <HeartHandshake className="h-5 w-5" /> Visitantes ({visitors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : visitors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum visitante cadastrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 font-semibold">Nome</th>
                          <th className="text-left py-3 font-semibold">Telefone</th>
                          <th className="text-left py-3 font-semibold">Email</th>
                          <th className="text-left py-3 font-semibold">Data da Visita</th>
                          <th className="text-right py-3 font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitors.map((v) => (
                          <tr key={v.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 font-medium">{v.full_name}</td>
                            <td className="py-3 text-muted-foreground">{v.phone || "—"}</td>
                            <td className="py-3 text-muted-foreground">{v.email || "—"}</td>
                            <td className="py-3 text-muted-foreground">{new Date(v.visit_date + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                            <td className="py-3 text-right">
                              <Button size="icon" variant="ghost" className="text-destructive h-7 w-7" onClick={() => deleteVisitor(v.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
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
        </Tabs>

        {/* Welcome Dialog */}
        <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
          <DialogContent className="text-center max-w-md">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <PartyPopper className="h-8 w-8 text-primary" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">Que alegria! 🎉</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">{lastVisitorName}</span> foi cadastrado(a) com sucesso!
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Que bênção receber mais uma pessoa especial em nossa igreja! 🙏✨ Que este seja o começo de uma caminhada linda e cheia de graça. Sejam todos muito bem-vindos!
              </p>
              <Button onClick={() => setShowWelcomeDialog(false)} className="mt-2 gap-1.5">
                <HeartHandshake className="h-4 w-4" /> Amém! Obrigado!
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
