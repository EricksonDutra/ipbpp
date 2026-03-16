import { useEffect, useState } from "react";
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
  DollarSign, TrendingUp, TrendingDown, HandHeart,
  FolderKanban, Heart, Send, Users, ClipboardList, Megaphone, BookHeart
} from "lucide-react";
import { PastoralTab } from "@/components/dashboard/PastoralTab";
import { toast } from "sonner";

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

  const totalReceita = financials.reduce((s, d) => s + Number(d.receita), 0);
  const totalDespesa = financials.reduce((s, d) => s + Number(d.despesa), 0);
  const saldo = totalReceita - totalDespesa;

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
          <h1 className="text-2xl font-sans font-bold">
            Olá, {profile?.full_name || "Membro"}!
          </h1>
          <p className="text-sm text-muted-foreground">Acompanhe as informações da nossa igreja.</p>
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
                  <CardContent className="p-4">
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

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {[
            { icon: DollarSign, label: "Receitas", value: `R$ ${totalReceita.toLocaleString("pt-BR")}`, color: "text-success" },
            { icon: TrendingDown, label: "Despesas", value: `R$ ${totalDespesa.toLocaleString("pt-BR")}`, color: "text-destructive" },
            { icon: TrendingUp, label: "Saldo", value: `R$ ${saldo.toLocaleString("pt-BR")}`, color: "text-primary" },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-bold">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="financeiro" className="space-y-6">
          <TabsList className={`grid w-full ${(isAdmin || isPastor) ? 'grid-cols-5' : 'grid-cols-4'} max-w-2xl`}>
            <TabsTrigger value="financeiro" className="gap-1.5">
              <HandHeart className="h-4 w-4" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="oracao" className="gap-1.5">
              <Heart className="h-4 w-4" /> Oração
            </TabsTrigger>
            <TabsTrigger value="projetos" className="gap-1.5">
              <FolderKanban className="h-4 w-4" /> Projetos
            </TabsTrigger>
            <TabsTrigger value="solicitacoes" className="gap-1.5">
              <ClipboardList className="h-4 w-4" /> Solicitações
            </TabsTrigger>
            {(isAdmin || isPastor) && (
              <TabsTrigger value="pastoral" className="gap-1.5">
                <BookHeart className="h-4 w-4" /> Pastoral
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="financeiro">
            <Card>
              <CardHeader>
                <CardTitle className="font-sans">Relatório Financeiro</CardTitle>
                <CardDescription>Receitas e despesas mensais da igreja.</CardDescription>
              </CardHeader>
              <CardContent>
                {financials.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum relatório financeiro cadastrado ainda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 font-semibold">Mês</th>
                          <th className="text-right py-3 font-semibold">Receita</th>
                          <th className="text-right py-3 font-semibold">Despesa</th>
                          <th className="text-right py-3 font-semibold">Saldo</th>
                          <th className="text-center py-3 font-semibold">Detalhes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financials.map((row) => (
                          <tr key={row.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3">{row.month}/{row.year}</td>
                            <td className="text-right text-success font-medium">R$ {Number(row.receita).toLocaleString("pt-BR")}</td>
                            <td className="text-right text-destructive font-medium">R$ {Number(row.despesa).toLocaleString("pt-BR")}</td>
                            <td className="text-right font-bold">R$ {(Number(row.receita) - Number(row.despesa)).toLocaleString("pt-BR")}</td>
                            <td className="text-center">
                              {row.document_url ? (
                                <Button size="sm" variant="outline" className="gap-1" onClick={() => handleOpenDocument(row.document_url)}>
                                  <FileText className="h-3.5 w-3.5" /> Ver
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold">
                          <td className="py-3">Total</td>
                          <td className="text-right text-success">R$ {totalReceita.toLocaleString("pt-BR")}</td>
                          <td className="text-right text-destructive">R$ {totalDespesa.toLocaleString("pt-BR")}</td>
                          <td className="text-right">R$ {saldo.toLocaleString("pt-BR")}</td>
                        </tr>
                      </tfoot>
                    </table>
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
                      <CardContent className="p-4">
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
                      <CardContent className="p-4">
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
