import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MemberHeader } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DollarSign, TrendingUp, TrendingDown, HandHeart,
  FolderKanban, Heart, Send, Users, ClipboardList, Megaphone, BookHeart, CalendarDays, Shield
} from "lucide-react";
import { PastoralTab } from "@/components/dashboard/PastoralTab";
import { EscalasTab } from "@/components/dashboard/EscalasTab";
import { toast } from "sonner";

const MONTHS_OPTIONS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function Dashboard() {
  const { user, profile, isAdmin, isPastor } = useAuth();
  const [newPrayer, setNewPrayer] = useState("");
  const [prayerCategory, setPrayerCategory] = useState("Geral");
  const [prayerVisibility, setPrayerVisibility] = useState("public");
  const [prayers, setPrayers] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [memberNotices, setMemberNotices] = useState<any[]>([]);
  const [requestForm, setRequestForm] = useState({ request_type: "salao_social" as string, description: "" });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));
  const [filterMonth, setFilterMonth] = useState<string>("todos");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [prayersRes, financialsRes, projectsRes, requestsRes, noticesRes] = await Promise.all([
      supabase.from("prayer_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("financial_reports").select("*").order("year", { ascending: true }).order("month", { ascending: true }),
      supabase.from("church_projects").select("*").order("created_at", { ascending: false }),
      supabase.from("member_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("notices").select("*").eq("category", "members").eq("active", true).order("created_at", { ascending: false }),
    ]);
    setPrayers(prayersRes.data || []);
    setFinancials(financialsRes.data || []);
    setProjects(projectsRes.data || []);
    setRequests(requestsRes.data || []);
    setMemberNotices(noticesRes.data || []);
    setLoading(false);
  };

  // Distinct years from financials
  const availableYears = useMemo(() => {
    const years = [...new Set(financials.map((f) => f.year))].sort((a, b) => b - a);
    if (years.length === 0) years.push(new Date().getFullYear());
    return years;
  }, [financials]);

  // Filtered financials
  const filteredFinancials = useMemo(() => {
    return financials.filter((f) => {
      if (filterYear !== "todos" && f.year !== Number(filterYear)) return false;
      if (filterMonth !== "todos" && f.month !== filterMonth) return false;
      return true;
    });
  }, [financials, filterYear, filterMonth]);

  const totalReceita = filteredFinancials.reduce((s, d) => s + Number(d.receita), 0);
  const totalDespesa = filteredFinancials.reduce((s, d) => s + Number(d.despesa), 0);
  const saldo = totalReceita - totalDespesa;

  const saldoColor = saldo > 0 ? "text-success" : saldo < 0 ? "text-destructive" : "text-muted-foreground";

  const filterLabel = useMemo(() => {
    const y = filterYear === "todos" ? "todos os anos" : filterYear;
    const m = filterMonth === "todos" ? "" : ` – ${filterMonth}`;
    return `Exibindo registros de ${y}${m}`;
  }, [filterYear, filterMonth]);

  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayer.trim() || !user) return;

    const { error } = await supabase.from("prayer_requests").insert({
      user_id: user.id,
      author_name: profile?.full_name || "Membro",
      content: newPrayer,
      category: prayerCategory,
      visibility: prayerVisibility,
    } as any);

    if (error) {
      toast.error("Erro ao enviar pedido: " + error.message);
    } else {
      toast.success("Pedido de oração enviado!");
      setNewPrayer("");
      setPrayerCategory("Geral");
      setPrayerVisibility("public");
      fetchData();
    }
  };

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

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.description.trim() || !user) return;
    setSubmittingRequest(true);
    const { error } = await supabase.from("member_requests").insert({
      user_id: user.id,
      request_type: requestForm.request_type as any,
      description: requestForm.description.trim(),
    });
    setSubmittingRequest(false);
    if (error) {
      toast.error("Erro ao enviar solicitação: " + error.message);
    } else {
      toast.success("Solicitação enviada com sucesso!");
      setRequestForm({ request_type: "salao_social", description: "" });
      fetchData();
    }
  };

  const handleOpenDocument = async (filePath: string) => {
    try {
      const { data } = await supabase.storage.from("financial-docs").createSignedUrl(filePath, 3600);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        toast.error("Não foi possível abrir o documento.");
      }
    } catch {
      toast.error("Não foi possível abrir o documento.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <MemberHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <MemberHeader />
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-sans font-bold">
                Olá, {profile?.full_name || "Membro"}!
              </h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe os pedidos de oração, finanças e projetos da igreja em um só lugar.
              </p>
            </div>
            {(isAdmin || isPastor) && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Shield className="h-4 w-4" /> Ir para Painel Administrativo
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Avisos para Membros */}
        {memberNotices.length > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="text-lg font-sans font-bold flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" /> Avisos
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {memberNotices.map((n) => (
                <Card key={n.id} className="border-primary/30 bg-primary/5">
                  <CardContent className="p-5">
                    <h3 className="font-sans font-bold text-sm">{n.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{n.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(n.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Financial Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-xl font-bold text-success">R$ {totalReceita.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-xl font-bold text-destructive">R$ {totalDespesa.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${saldo > 0 ? "bg-success/10" : saldo < 0 ? "bg-destructive/10" : "bg-muted"}`}>
                <TrendingUp className={`h-5 w-5 ${saldoColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-xl font-bold ${saldoColor}`}>R$ {saldo.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">Somatório dos relatórios do período selecionado</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="financeiro" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            <TabsList className="inline-flex w-auto gap-1 bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="financeiro" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <HandHeart className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Financeiro</span>
              </TabsTrigger>
              <TabsTrigger value="oracao" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Heart className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Oração</span>
              </TabsTrigger>
              <TabsTrigger value="projetos" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <FolderKanban className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Projetos</span>
              </TabsTrigger>
              <TabsTrigger value="escalas" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <CalendarDays className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Escalas</span>
              </TabsTrigger>
              <TabsTrigger value="solicitacoes" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <ClipboardList className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Solicitações</span>
              </TabsTrigger>
              {(isAdmin || isPastor) && (
                <TabsTrigger value="pastoral" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <BookHeart className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Pastoral</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="financeiro">
            <Card>
              <CardHeader>
                <CardTitle className="font-sans">Relatório Financeiro</CardTitle>
                <CardDescription>Receitas e despesas mensais da igreja.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Period Filters */}
                <div className="flex flex-wrap items-end gap-3 mb-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Ano</label>
                    <Select value={filterYear} onValueChange={setFilterYear}>
                      <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {availableYears.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Mês</label>
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                      <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {MONTHS_OPTIONS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{filterLabel}</p>

                {filteredFinancials.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum relatório encontrado para este período. Fale com a administração para cadastrar os relatórios financeiros.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <TooltipProvider>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 font-semibold">Período (Mês/Ano)</th>
                            <th className="text-right py-3 font-semibold">Receita</th>
                            <th className="text-right py-3 font-semibold">Despesa</th>
                            <th className="text-right py-3 font-semibold">Saldo</th>
                            <th className="text-center py-3 font-semibold">Relatório detalhado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFinancials.map((row) => {
                            const rowSaldo = Number(row.receita) - Number(row.despesa);
                            const rowSaldoColor = rowSaldo > 0 ? "text-success" : rowSaldo < 0 ? "text-destructive" : "text-muted-foreground";
                            return (
                              <tr key={row.id} className="border-b last:border-0 hover:bg-muted/50">
                                <td className="py-3">{row.month}/{row.year}</td>
                                <td className="text-right text-success font-medium">R$ {Number(row.receita).toLocaleString("pt-BR")}</td>
                                <td className="text-right text-destructive font-medium">R$ {Number(row.despesa).toLocaleString("pt-BR")}</td>
                                <td className={`text-right font-bold ${rowSaldoColor}`}>R$ {rowSaldo.toLocaleString("pt-BR")}</td>
                                <td className="text-center">
                                  {row.document_url ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleOpenDocument(row.document_url)}>
                                          <FileText className="h-3.5 w-3.5" /> Ver
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Abrir relatório detalhado</TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <Badge variant="outline" className="text-xs text-muted-foreground">Sem anexo</Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 bg-muted/50 font-bold">
                            <td className="py-3">Total</td>
                            <td className="text-right text-success">R$ {totalReceita.toLocaleString("pt-BR")}</td>
                            <td className="text-right text-destructive">R$ {totalDespesa.toLocaleString("pt-BR")}</td>
                            <td className={`text-right ${saldoColor}`}>R$ {saldo.toLocaleString("pt-BR")}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </TooltipProvider>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="oracao">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="font-sans text-lg">Novo Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePrayerSubmit} className="space-y-3">
                    <select
                      value={prayerCategory}
                      onChange={(e) => setPrayerCategory(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="Geral">Geral</option>
                      <option value="Saúde">Saúde</option>
                      <option value="Família">Família</option>
                      <option value="Gratidão">Gratidão</option>
                      <option value="Trabalho">Trabalho</option>
                    </select>
                    <select
                      value={prayerVisibility}
                      onChange={(e) => setPrayerVisibility(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="public">Visível para todos os membros</option>
                      <option value="admin">Visível apenas para o pastor/admin</option>
                    </select>
                    <Textarea
                      placeholder="Escreva seu pedido de oração..."
                      value={newPrayer}
                      onChange={(e) => setNewPrayer(e.target.value)}
                      rows={4}
                      required
                    />
                    <Button type="submit" className="w-full gap-1.5">
                      <Send className="h-4 w-4" /> Enviar Pedido
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-sans font-bold text-lg">Pedidos Recentes</h3>
                {prayers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum pedido de oração ainda.</p>
                ) : (
                  prayers.map((p) => (
                    <Card key={p.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{p.author_name}</span>
                            <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                            {p.visibility === "admin" && (
                              <Badge variant="outline" className="text-xs">Privado</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{p.content}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projetos">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto cadastrado ainda.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-sans font-bold">{p.name}</h3>
                        <Badge variant={p.status === "Concluído" ? "default" : p.status === "Em andamento" ? "secondary" : "outline"}>
                          {p.status}
                        </Badge>
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
          </TabsContent>

          <TabsContent value="solicitacoes">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="font-sans text-lg">Nova Solicitação</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRequestSubmit} className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo</label>
                      <Select value={requestForm.request_type} onValueChange={(v) => setRequestForm({ ...requestForm, request_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salao_social">Uso do Salão Social</SelectItem>
                          <SelectItem value="emprestimo_utensilios">Empréstimo de Utensílios</SelectItem>
                          <SelectItem value="visita">Visita</SelectItem>
                          <SelectItem value="outra">Outra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Descreva sua solicitação com detalhes (data, horário, etc.)..."
                      value={requestForm.description}
                      onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                      rows={4}
                      required
                    />
                    <Button type="submit" className="w-full gap-1.5" disabled={submittingRequest}>
                      <Send className="h-4 w-4" /> {submittingRequest ? "Enviando..." : "Enviar Solicitação"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-sans font-bold text-lg">Minhas Solicitações</h3>
                {requests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma solicitação enviada ainda.</p>
                ) : (
                  requests.map((r) => (
                    <Card key={r.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{REQUEST_TYPE_LABELS[r.request_type] || r.request_type}</Badge>
                            <Badge variant={r.status === "aprovada" ? "default" : r.status === "rejeitada" ? "destructive" : "outline"} className="text-xs">
                              {STATUS_LABELS[r.status] || r.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{r.description}</p>
                        {r.admin_notes && (
                          <div className="mt-2 p-2 rounded bg-muted text-sm">
                            <span className="font-semibold text-xs">Resposta:</span> {r.admin_notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="escalas">
            <EscalasTab />
          </TabsContent>
          {(isAdmin || isPastor) && (
            <TabsContent value="pastoral">
              <PastoralTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
