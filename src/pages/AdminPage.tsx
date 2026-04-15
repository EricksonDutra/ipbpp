import { useEffect, useState, useRef, useMemo } from "react";
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
  Upload, FileText, X, HeartHandshake, ClipboardList,
  Check, Megaphone, BookOpen, AlertTriangle, Search, ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BulletinManagement } from "@/components/admin/BulletinManagement";

interface MemberRow {
  id: string;
  full_name: string;
  phone: string | null;
  active: boolean;
  roles: string[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  member: "Membro",
  pastor: "Pastor",
  presbitero: "Presbítero",
  diacono: "Diácono",
  presidente_sociedade: "Presidente de Sociedade",
  gestor_midias: "Gestor de Mídias",
};

const ASSIGNABLE_ROLES = ["pastor", "presbitero", "diacono", "presidente_sociedade", "gestor_midias"] as const;

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
  id: string; full_name: string; phone: string | null; email: string | null;
  cidade: string | null; uf: string | null; is_ipb_member: boolean;
  other_church: string | null; notes: string | null; visit_date: string; created_at: string;
}

interface RequestRow {
  id: string; user_id: string; request_type: string; description: string;
  status: string; admin_notes: string | null; reviewed_at: string | null; created_at: string;
}

interface NoticeRow {
  id: string; title: string; content: string; category: string; active: boolean; created_at: string;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  salao_social: "Uso do Salão Social",
  emprestimo_utensilios: "Empréstimo de Utensílios",
  visita: "Visita",
  outra: "Outra",
};

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const PROJECT_STATUSES = ["Planejamento", "Em andamento", "Concluído"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "doc", "docx", "xls", "xlsx"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeLabel(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "PDF";
  if (["png", "jpg", "jpeg"].includes(ext)) return "Imagem";
  if (["doc", "docx"].includes(ext)) return "Word";
  if (["xls", "xlsx"].includes(ext)) return "Excel";
  return ext.toUpperCase();
}

export default function AdminPage() {
  const { session } = useAuth();

  // Members state
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberForm, setMemberForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [submittingMember, setSubmittingMember] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [roleTarget, setRoleTarget] = useState<MemberRow | null>(null);
  const [memberSearch, setMemberSearch] = useState("");

  // Financial state
  const [financials, setFinancials] = useState<FinancialRow[]>([]);
  const [showFinancialDialog, setShowFinancialDialog] = useState(false);
  const [editingFinancial, setEditingFinancial] = useState<FinancialRow | null>(null);
  const [financialForm, setFinancialForm] = useState({ month: "Janeiro", year: new Date().getFullYear(), receita: 0, despesa: 0 });
  const [submittingFinancial, setSubmittingFinancial] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [financialSortAsc, setFinancialSortAsc] = useState(false);

  // Projects state
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", status: "Planejamento", progress: 0 });
  const [submittingProject, setSubmittingProject] = useState(false);

  // Visitors state
  const [visitors, setVisitors] = useState<VisitorRow[]>([]);
  const [visitorToDelete, setVisitorToDelete] = useState<VisitorRow | null>(null);

  // Requests state
  const [memberRequests, setMemberRequests] = useState<RequestRow[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Notices state
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeRow | null>(null);
  const [noticeForm, setNoticeForm] = useState({ title: "", content: "", category: "public" as string });
  const [submittingNotice, setSubmittingNotice] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [membersRes, financialsRes, projectsRes, visitorsRes, requestsRes, noticesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, active"),
      supabase.from("financial_reports").select("*").order("year", { ascending: false }).order("month", { ascending: true }),
      supabase.from("church_projects").select("*").order("created_at", { ascending: false }),
      supabase.from("visitors").select("*").order("visit_date", { ascending: false }),
      supabase.from("member_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("notices").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const rolesMap: Record<string, string[]> = {};
    (rolesRes.data || []).forEach((r: any) => {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push(r.role);
    });

    const mappedMembers = (membersRes.data || []).map((m: any) => ({ ...m, roles: rolesMap[m.id] || [] }));
    setMembers(mappedMembers);
    setRoleTarget(prev => prev ? mappedMembers.find((m: MemberRow) => m.id === prev.id) || null : null);
    setFinancials(financialsRes.data || []);
    setProjects(projectsRes.data || []);
    setVisitors(visitorsRes.data as VisitorRow[] || []);
    setMemberRequests(requestsRes.data as RequestRow[] || []);
    setNotices(noticesRes.data as NoticeRow[] || []);
    setLoading(false);
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const q = memberSearch.toLowerCase();
    return members.filter((m) => m.full_name.toLowerCase().includes(q));
  }, [members, memberSearch]);

  // Sorted financials
  const sortedFinancials = useMemo(() => {
    if (financialSortAsc) {
      return [...financials].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
      });
    }
    return financials;
  }, [financials, financialSortAsc]);

  // Sorted notices: active first, then inactive
  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [notices]);

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

  const toggleRole = async (userId: string, role: string, add: boolean) => {
    if (add) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
      if (error) { toast.error("Erro ao adicionar função"); return; }
      toast.success(`Função "${ROLE_LABELS[role]}" adicionada!`);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
      if (error) { toast.error("Erro ao remover função"); return; }
      toast.success(`Função "${ROLE_LABELS[role]}" removida!`);
    }
    fetchAll();
  };

  // ─── Financial ────────────────────────────────────
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
    await supabase.storage.from("financial-docs").remove([filePath]);
    const { error } = await supabase.storage
      .from("financial-docs")
      .upload(filePath, selectedFile, { upsert: true });
    if (error) {
      toast.error("Erro ao fazer upload: " + error.message);
      return null;
    }
    return filePath;
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) { setSelectedFile(null); return; }
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Tipo de arquivo não permitido (.${ext}). Use: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Arquivo muito grande (${formatFileSize(file.size)}). Máximo permitido: 10 MB.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleFinancialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFinancial(true);

    // Duplicate check (only for new records)
    if (!editingFinancial) {
      const duplicate = financials.find(
        (f) => f.month === financialForm.month && f.year === financialForm.year
      );
      if (duplicate) {
        toast.error(`Já existe um relatório para ${financialForm.month}/${financialForm.year}. Edite o registro existente.`);
        setSubmittingFinancial(false);
        setShowFinancialDialog(false);
        openFinancialDialog(duplicate);
        return;
      }
    }

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
  const confirmDeleteVisitor = async () => {
    if (!visitorToDelete) return;
    const { error } = await supabase.from("visitors").delete().eq("id", visitorToDelete.id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else { toast.success("Visitante removido!"); fetchAll(); }
    setVisitorToDelete(null);
  };

  // ─── Requests ─────────────────────────────────────
  const handleReviewRequest = async (id: string, newStatus: "aprovada" | "rejeitada") => {
    const { error } = await supabase.from("member_requests").update({
      status: newStatus,
      admin_notes: reviewNotes[id]?.trim() || null,
      reviewed_at: new Date().toISOString(),
    } as any).eq("id", id);
    if (error) toast.error("Erro ao atualizar: " + error.message);
    else {
      toast.success(newStatus === "aprovada" ? "Solicitação aprovada!" : "Solicitação rejeitada!");
      setReviewNotes((prev) => { const n = { ...prev }; delete n[id]; return n; });
      fetchAll();
    }
  };

  // ─── Notices ──────────────────────────────────────
  const openNoticeDialog = (row?: NoticeRow) => {
    if (row) {
      setEditingNotice(row);
      setNoticeForm({ title: row.title, content: row.content, category: row.category });
    } else {
      setEditingNotice(null);
      setNoticeForm({ title: "", content: "", category: "public" });
    }
    setShowNoticeDialog(true);
  };

  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim()) return;
    setSubmittingNotice(true);
    if (editingNotice) {
      const { error } = await supabase.from("notices").update({
        title: noticeForm.title,
        content: noticeForm.content,
        category: noticeForm.category as any,
      }).eq("id", editingNotice.id);
      if (error) toast.error("Erro ao atualizar: " + error.message);
      else toast.success("Aviso atualizado!");
    } else {
      const { error } = await supabase.from("notices").insert({
        title: noticeForm.title,
        content: noticeForm.content,
        category: noticeForm.category as any,
      });
      if (error) toast.error("Erro ao criar: " + error.message);
      else toast.success("Aviso criado!");
    }
    setSubmittingNotice(false);
    setShowNoticeDialog(false);
    fetchAll();
  };

  const toggleNoticeActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("notices").update({ active }).eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success(active ? "Aviso ativado!" : "Aviso desativado!"); fetchAll(); }
  };

  const deleteNotice = async (id: string) => {
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else { toast.success("Aviso excluído!"); fetchAll(); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <MemberHeader />
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-sans font-bold">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">Gerencie membros, finanças, projetos, visitantes e solicitações da igreja.</p>
        </div>

        <Tabs defaultValue="membros" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            <TabsList className="inline-flex w-auto gap-1 bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="membros" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Users className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Membros</span>
              </TabsTrigger>
              <TabsTrigger value="visitantes" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <HeartHandshake className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Visitantes</span>
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <DollarSign className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Financeiro</span>
              </TabsTrigger>
              <TabsTrigger value="projetos" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <FolderKanban className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Projetos</span>
              </TabsTrigger>
              <TabsTrigger value="solicitacoes" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <ClipboardList className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Solicitações</span>
              </TabsTrigger>
              <TabsTrigger value="avisos" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Megaphone className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Avisos</span>
              </TabsTrigger>
              <TabsTrigger value="boletim" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BookOpen className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Boletim</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ─── TAB: MEMBROS ─── */}
          <TabsContent value="membros">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar membro por nome..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
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
                  <Users className="h-5 w-5" /> Membros ({filteredMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {memberSearch ? "Nenhum membro encontrado com esse nome." : "Nenhum membro cadastrado."}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 font-semibold">Nome</th>
                          <th className="text-left py-3 font-semibold">Telefone</th>
                          <th className="text-left py-3 font-semibold">Funções</th>
                          <th className="text-center py-3 font-semibold">Status</th>
                          <th className="text-right py-3 font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.map((m) => (
                          <tr key={m.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 font-medium">{m.full_name}</td>
                            <td className="py-3 text-muted-foreground">{m.phone || "—"}</td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-1">
                                {m.roles.includes("admin") && (
                                  <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">Administrador</Badge>
                                )}
                                {m.roles.filter(r => r !== "member" && r !== "admin").map(r => (
                                  <Badge key={r} variant="secondary" className="text-xs">{ROLE_LABELS[r] || r}</Badge>
                                ))}
                                {m.roles.filter(r => r !== "member").length === 0 && (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              <Badge variant={m.active ? "default" : "destructive"}>{m.active ? "Ativo" : "Inativo"}</Badge>
                            </td>
                            <td className="py-3 text-right space-x-1">
                              <Button size="sm" variant="outline" onClick={() => { setRoleTarget(m); setShowRoleDialog(true); }} className="gap-1">
                                <Pencil className="h-3.5 w-3.5" /> Funções
                              </Button>
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

            {/* Role Management Dialog */}
            <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Funções de {roleTarget?.full_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {ASSIGNABLE_ROLES.map((role) => {
                    const hasRole = roleTarget?.roles.includes(role) || false;
                    return (
                      <div key={role} className="flex items-center justify-between py-2 px-3 rounded-md border">
                        <span className="font-medium text-sm">{ROLE_LABELS[role]}</span>
                        <Button
                          size="sm"
                          variant={hasRole ? "destructive" : "default"}
                          onClick={() => roleTarget && toggleRole(roleTarget.id, role, !hasRole)}
                          className="gap-1"
                        >
                          {hasRole ? (<><XCircle className="h-3.5 w-3.5" /> Remover</>) : (<><CheckCircle className="h-3.5 w-3.5" /> Adicionar</>)}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                          <th className="text-left py-3 font-semibold">
                            <button
                              type="button"
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                              onClick={() => setFinancialSortAsc(!financialSortAsc)}
                            >
                              Período <ArrowUpDown className="h-3.5 w-3.5" />
                            </button>
                          </th>
                          <th className="text-right py-3 font-semibold">Receita</th>
                          <th className="text-right py-3 font-semibold">Despesa</th>
                          <th className="text-right py-3 font-semibold">Saldo</th>
                          <th className="text-center py-3 font-semibold">Status</th>
                          <th className="text-center py-3 font-semibold">Documento</th>
                          <th className="text-right py-3 font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedFinancials.map((f) => {
                          const rowSaldo = Number(f.receita) - Number(f.despesa);
                          const rowSaldoColor = rowSaldo > 0 ? "text-success" : rowSaldo < 0 ? "text-destructive" : "text-muted-foreground";
                          return (
                            <tr key={f.id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-3 font-medium">{f.month}/{f.year}</td>
                              <td className="py-3 text-right text-success font-medium">R$ {Number(f.receita).toLocaleString("pt-BR")}</td>
                              <td className="py-3 text-right text-destructive font-medium">R$ {Number(f.despesa).toLocaleString("pt-BR")}</td>
                              <td className={`py-3 text-right font-bold ${rowSaldoColor}`}>R$ {rowSaldo.toLocaleString("pt-BR")}</td>
                              <td className="py-3 text-center">
                                {f.document_url ? (
                                  <Badge className="text-xs bg-success/10 text-success border-success/30 hover:bg-success/10">Com anexo</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">Sem anexo</Badge>
                                )}
                              </td>
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
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="py-3 text-right space-x-1">
                                <Button size="icon" variant="ghost" onClick={() => openFinancialDialog(f)}><Pencil className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteFinancial(f.id)}><Trash2 className="h-4 w-4" /></Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={showFinancialDialog} onOpenChange={setShowFinancialDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingFinancial ? "Editar Relatório Financeiro" : "Novo Relatório Financeiro"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFinancialSubmit} className="space-y-5">
                  {/* Group: Período */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Período</p>
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
                  </div>

                  {/* Group: Valores */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Valores</p>
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
                  </div>

                  {/* Group: Documento */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Documento</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    />
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4" /> {selectedFile ? "Trocar arquivo" : "Anexar arquivo"}
                      </Button>
                      {selectedFile && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5">
                          <FileText className="h-4 w-4 shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate max-w-[180px] text-xs font-medium text-foreground">{selectedFile.name}</p>
                            <p className="text-xs">{formatFileSize(selectedFile.size)} · {getFileTypeLabel(selectedFile.name)}</p>
                          </div>
                          <Button type="button" size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setSelectedFile(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {!selectedFile && editingFinancial?.document_url && (
                        <span className="text-xs text-muted-foreground">Documento atual será mantido</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Máx. 10 MB · PDF, imagem, Word ou Excel</p>
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
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openProjectDialog(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteProject(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{p.description}</p>
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
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-3">
                Compartilhe o link com visitantes para preencherem seus dados pelo celular.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => {
                  const url = `${window.location.origin}/visitante`;
                  navigator.clipboard.writeText(url);
                  toast.success("Link copiado! Compartilhe com o visitante.");
                }} variant="outline" className="gap-1.5">
                  📋 Copiar Link
                </Button>
                <Button onClick={() => window.open("/visitante", "_blank")} className="gap-1.5">
                  <UserPlus className="h-4 w-4" /> Abrir Cadastro de Visitante
                </Button>
              </div>
            </div>

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
                          <th className="text-left py-3 font-semibold">Cidade/UF</th>
                          <th className="text-left py-3 font-semibold">Telefone</th>
                          <th className="text-left py-3 font-semibold">IPB</th>
                          <th className="text-left py-3 font-semibold">Data</th>
                          <th className="text-right py-3 font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitors.map((v) => (
                          <tr key={v.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 font-medium">{v.full_name}</td>
                            <td className="py-3 text-muted-foreground">
                              {[v.cidade, v.uf].filter(Boolean).join("/") || "—"}
                            </td>
                            <td className="py-3 text-muted-foreground">{v.phone || "—"}</td>
                            <td className="py-3">
                              {v.is_ipb_member ? (
                                <Badge>Sim</Badge>
                              ) : (
                                <Badge variant="outline">{v.other_church || "Não"}</Badge>
                              )}
                            </td>
                            <td className="py-3 text-muted-foreground">{new Date(v.visit_date + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                            <td className="py-3 text-right">
                              <Button size="icon" variant="ghost" className="text-destructive h-7 w-7" onClick={() => setVisitorToDelete(v)}>
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

            {/* Visitor delete confirmation */}
            <AlertDialog open={!!visitorToDelete} onOpenChange={(open) => !open && setVisitorToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover visitante</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover <strong>{visitorToDelete?.full_name}</strong>? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDeleteVisitor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* ─── TAB: SOLICITAÇÕES ─── */}
          <TabsContent value="solicitacoes">
            <Card>
              <CardHeader>
                <CardTitle className="font-sans flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" /> Solicitações ({memberRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memberRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma solicitação recebida.</p>
                ) : (
                  <div className="space-y-4">
                    {memberRequests.map((r) => (
                      <Card key={r.id} className={r.status === "pendente" ? "border-amber-300 bg-amber-50/50" : ""}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {r.status === "pendente" && (
                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                              )}
                              <Badge variant="secondary" className="text-xs">{REQUEST_TYPE_LABELS[r.request_type] || r.request_type}</Badge>
                              <Badge variant={r.status === "aprovada" ? "default" : r.status === "rejeitada" ? "destructive" : "outline"} className="text-xs">
                                {STATUS_LABELS[r.status] || r.status}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(r.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Solicitante: <span className="font-medium text-foreground">{members.find(m => m.id === r.user_id)?.full_name || "—"}</span>
                          </p>
                          <p className="text-sm mb-3">{r.description}</p>
                          {r.status === "pendente" && (
                            <div className="space-y-2 pt-2 border-t">
                              <Input
                                placeholder="Observação do administrador (opcional)"
                                value={reviewNotes[r.id] || ""}
                                onChange={(e) => setReviewNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" className="gap-1" onClick={() => handleReviewRequest(r.id, "aprovada")}>
                                  <Check className="h-3.5 w-3.5" /> Aprovar
                                </Button>
                                <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleReviewRequest(r.id, "rejeitada")}>
                                  <X className="h-3.5 w-3.5" /> Rejeitar
                                </Button>
                              </div>
                            </div>
                          )}
                          {r.admin_notes && r.status !== "pendente" && (
                            <div className="mt-2 p-2 rounded bg-muted text-sm">
                              <span className="font-semibold text-xs">Observação:</span> {r.admin_notes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB: AVISOS ─── */}
          <TabsContent value="avisos">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openNoticeDialog()} className="gap-1.5">
                <Plus className="h-4 w-4" /> Novo Aviso
              </Button>
            </div>

            {notices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum aviso cadastrado.</p>
            ) : (
              <div className="space-y-4">
                {sortedNotices.map((n) => (
                  <Card key={n.id} className={!n.active ? "opacity-60" : ""}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-sans font-bold text-sm">{n.title}</h3>
                            <Badge variant={n.category === "public" ? "default" : "secondary"} className="text-xs">
                              {n.category === "public" ? "Público" : "Membros"}
                            </Badge>
                          </div>
                          {!n.active && (
                            <span className="text-xs text-muted-foreground font-medium">Inativo</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleNoticeActive(n.id, !n.active)}>
                            {n.active ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openNoticeDialog(n)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteNotice(n.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{n.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(n.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingNotice ? "Editar Aviso" : "Novo Aviso"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleNoticeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Título *</label>
                    <Input value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Conteúdo</label>
                    <Textarea value={noticeForm.content} onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoria</label>
                    <Select value={noticeForm.category} onValueChange={(v) => setNoticeForm({ ...noticeForm, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Público (aparece na home)</SelectItem>
                        <SelectItem value="members">Membros (aparece no painel)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={submittingNotice}>{submittingNotice ? "Salvando..." : "Salvar"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ─── TAB: BOLETIM ─── */}
          <TabsContent value="boletim">
            <BulletinManagement />
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}
