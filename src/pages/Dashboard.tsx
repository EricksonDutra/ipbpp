import { useState } from "react";
import { MemberHeader } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, TrendingUp, TrendingDown, HandHeart, 
  FolderKanban, Heart, Send, Calendar, Users, BookOpen 
} from "lucide-react";
import { toast } from "sonner";

const financialData = [
  { month: "Janeiro", receita: 12500, despesa: 9800 },
  { month: "Fevereiro", receita: 13200, despesa: 10100 },
  { month: "Março", receita: 11800, despesa: 9500 },
  { month: "Abril", receita: 14000, despesa: 11200 },
  { month: "Maio", receita: 13500, despesa: 10800 },
  { month: "Junho", receita: 15000, despesa: 11500 },
];

const projects = [
  { name: "Reforma do Templo", status: "Em andamento", progress: 65, desc: "Reforma da fachada e pintura interna do templo." },
  { name: "Ação Social - Inverno Solidário", status: "Planejamento", progress: 20, desc: "Arrecadação de agasalhos para famílias carentes." },
  { name: "Escola Bíblica de Férias", status: "Concluído", progress: 100, desc: "Programação especial para crianças durante as férias." },
  { name: "Missão em Pedro Juan", status: "Em andamento", progress: 40, desc: "Evangelização e assistência na cidade vizinha." },
];

const prayerRequests = [
  { id: 1, author: "Maria S.", text: "Peço oração pela saúde do meu esposo que está internado.", date: "05/02/2026", category: "Saúde" },
  { id: 2, author: "João P.", text: "Orações pela família em momento de dificuldade financeira.", date: "03/02/2026", category: "Família" },
  { id: 3, author: "Ana C.", text: "Agradeço a Deus pela aprovação no concurso! Glória a Deus!", date: "01/02/2026", category: "Gratidão" },
];

export default function Dashboard() {
  const [newPrayer, setNewPrayer] = useState("");
  const [prayerName, setPrayerName] = useState("");
  const [prayers, setPrayers] = useState(prayerRequests);

  const totalReceita = financialData.reduce((s, d) => s + d.receita, 0);
  const totalDespesa = financialData.reduce((s, d) => s + d.despesa, 0);
  const saldo = totalReceita - totalDespesa;

  const handlePrayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayer.trim() || !prayerName.trim()) return;
    setPrayers([
      { id: Date.now(), author: prayerName, text: newPrayer, date: new Date().toLocaleDateString("pt-BR"), category: "Geral" },
      ...prayers,
    ]);
    setNewPrayer("");
    setPrayerName("");
    toast.success("Pedido de oração enviado!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <MemberHeader />
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold">Painel do Membro</h1>
          <p className="text-sm text-muted-foreground">Acompanhe as informações da nossa igreja.</p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[
            { icon: DollarSign, label: "Receitas (2026)", value: `R$ ${totalReceita.toLocaleString("pt-BR")}`, color: "text-success" },
            { icon: TrendingDown, label: "Despesas (2026)", value: `R$ ${totalDespesa.toLocaleString("pt-BR")}`, color: "text-destructive" },
            { icon: TrendingUp, label: "Saldo", value: `R$ ${saldo.toLocaleString("pt-BR")}`, color: "text-primary" },
            { icon: Users, label: "Membros Ativos", value: "127", color: "text-accent" },
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
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="financeiro" className="gap-1.5">
              <HandHeart className="h-4 w-4" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="oracao" className="gap-1.5">
              <Heart className="h-4 w-4" /> Oração
            </TabsTrigger>
            <TabsTrigger value="projetos" className="gap-1.5">
              <FolderKanban className="h-4 w-4" /> Projetos
            </TabsTrigger>
          </TabsList>

          {/* Financeiro */}
          <TabsContent value="financeiro">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Relatório Financeiro — 2026</CardTitle>
                <CardDescription>Receitas e despesas mensais da igreja.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-semibold">Mês</th>
                        <th className="text-right py-3 font-semibold">Receita</th>
                        <th className="text-right py-3 font-semibold">Despesa</th>
                        <th className="text-right py-3 font-semibold">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.map((row) => (
                        <tr key={row.month} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3">{row.month}</td>
                          <td className="text-right text-success font-medium">R$ {row.receita.toLocaleString("pt-BR")}</td>
                          <td className="text-right text-destructive font-medium">R$ {row.despesa.toLocaleString("pt-BR")}</td>
                          <td className="text-right font-bold">R$ {(row.receita - row.despesa).toLocaleString("pt-BR")}</td>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Oração */}
          <TabsContent value="oracao">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Novo Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePrayerSubmit} className="space-y-3">
                    <Input
                      placeholder="Seu nome"
                      value={prayerName}
                      onChange={(e) => setPrayerName(e.target.value)}
                      required
                    />
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
                <h3 className="font-serif font-bold text-lg">Pedidos Recentes</h3>
                {prayers.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{p.author}</span>
                          <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{p.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{p.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Projetos */}
          <TabsContent value="projetos">
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((p) => (
                <Card key={p.name}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-serif font-bold">{p.name}</h3>
                      <Badge
                        variant={p.status === "Concluído" ? "default" : p.status === "Em andamento" ? "secondary" : "outline"}
                      >
                        {p.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
