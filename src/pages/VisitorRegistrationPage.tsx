import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { HeartHandshake, PartyPopper } from "lucide-react";
import ipbLogo from "@/assets/ipb-logo.png";

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function VisitorRegistrationPage() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    cidade: "",
    uf: "",
    is_ipb_member: "",
    other_church: "",
    notes: "",
    visit_date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setError("");
    setSubmitting(true);

    const { error: insertError } = await supabase.from("visitors").insert({
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      cidade: form.cidade.trim() || null,
      uf: form.uf || null,
      is_ipb_member: form.is_ipb_member === "sim",
      other_church: form.is_ipb_member === "nao" ? (form.other_church.trim() || null) : null,
      notes: form.notes.trim() || null,
      visit_date: form.visit_date,
    } as any);

    setSubmitting(false);

    if (insertError) {
      setError("Erro ao enviar cadastro. Tente novamente.");
      return;
    }

    setVisitorName(form.full_name.trim());
    setShowWelcome(true);
    setForm({
      full_name: "", phone: "", email: "", cidade: "", uf: "",
      is_ipb_member: "", other_church: "", notes: "",
      visit_date: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-3">
          <img src={ipbLogo} alt="IPB Logo" className="h-16 mx-auto" />
          <CardTitle className="font-sans text-xl">Cadastro de Visitante</CardTitle>
          <p className="text-sm text-muted-foreground">
            Seja muito bem-vindo(a)! Preencha seus dados para que possamos conhecê-lo(a) melhor. 🙏
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo *</Label>
              <Input
                id="full_name"
                placeholder="Seu nome completo"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  maxLength={255}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="Sua cidade"
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Select value={form.uf} onValueChange={(v) => setForm({ ...form, uf: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {UF_LIST.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Faço parte da IPB</Label>
              <RadioGroup
                value={form.is_ipb_member}
                onValueChange={(v) => setForm({ ...form, is_ipb_member: v, other_church: "" })}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="sim" id="ipb-sim" />
                  <Label htmlFor="ipb-sim" className="font-normal cursor-pointer">Sim</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="nao" id="ipb-nao" />
                  <Label htmlFor="ipb-nao" className="font-normal cursor-pointer">Não</Label>
                </div>
              </RadioGroup>
            </div>

            {form.is_ipb_member === "nao" && (
              <div className="space-y-2">
                <Label htmlFor="other_church">Faz parte de outra igreja? Qual?</Label>
                <Input
                  id="other_church"
                  placeholder="Nome da igreja (opcional)"
                  value={form.other_church}
                  onChange={(e) => setForm({ ...form, other_church: e.target.value })}
                  maxLength={100}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Como conheceu a igreja, pedidos de oração, etc."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                maxLength={1000}
              />
            </div>

            <Input
              type="hidden"
              value={form.visit_date}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full gap-1.5" disabled={submitting}>
              <HeartHandshake className="h-4 w-4" />
              {submitting ? "Enviando..." : "Enviar Cadastro"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Welcome Dialog */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="text-center max-w-md">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <PartyPopper className="h-8 w-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-serif">Que alegria! 🎉</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">{visitorName}</span>, seja muito bem-vindo(a)!
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Estamos muito felizes com a sua presença! 🙏✨ Que este seja o começo de uma caminhada
              linda e cheia de graça. Você é uma bênção para nós! Fique à vontade, esta é a sua casa! 🏠💛
            </p>
            <Button onClick={() => setShowWelcome(false)} className="mt-2 gap-1.5">
              <HeartHandshake className="h-4 w-4" /> Amém! Obrigado(a)!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
