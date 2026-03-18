import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { UserRound, Pencil, Save, X, MapPin, Phone, Calendar, Briefcase, Heart, FileText } from "lucide-react";
import { toast } from "sonner";

export interface MemberProfileData {
  id: string;
  full_name: string;
  phone: string | null;
  active: boolean;
  endereco: string | null;
  data_nascimento: string | null;
  data_batismo: string | null;
  data_membresia: string | null;
  estado_civil: string | null;
  profissao: string | null;
  observacoes: string | null;
}

interface MemberProfileProps {
  member: MemberProfileData;
  onUpdate: () => void;
}

const ESTADO_CIVIL_OPTIONS = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
];

export function MemberProfile({ member, onUpdate }: MemberProfileProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    phone: member.phone || "",
    endereco: member.endereco || "",
    data_nascimento: member.data_nascimento || "",
    data_batismo: member.data_batismo || "",
    data_membresia: member.data_membresia || "",
    estado_civil: member.estado_civil || "",
    profissao: member.profissao || "",
    observacoes: member.observacoes || "",
  });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        phone: form.phone.trim() || null,
        endereco: form.endereco.trim() || null,
        data_nascimento: form.data_nascimento || null,
        data_batismo: form.data_batismo || null,
        data_membresia: form.data_membresia || null,
        estado_civil: form.estado_civil || null,
        profissao: form.profissao.trim() || null,
        observacoes: form.observacoes.trim() || null,
      } as any)
      .eq("id", member.id);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar perfil: " + error.message);
    } else {
      toast.success("Perfil atualizado!");
      setEditing(false);
      onUpdate();
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
  };

  const getEstadoCivilLabel = (v: string | null) => {
    if (!v) return "—";
    return ESTADO_CIVIL_OPTIONS.find((o) => o.value === v)?.label || v;
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <UserRound className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-sans text-xl">{member.full_name}</CardTitle>
              <Badge variant={member.active ? "default" : "destructive"} className="text-xs mt-1">
                {member.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
              <Pencil className="h-4 w-4" /> Editar Perfil
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Endereço</label>
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, número, bairro..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Nascimento</label>
              <Input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado Civil</label>
              <Select value={form.estado_civil} onValueChange={(v) => setForm({ ...form, estado_civil: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {ESTADO_CIVIL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Profissão</label>
              <Input value={form.profissao} onChange={(e) => setForm({ ...form, profissao: e.target.value })} placeholder="Ex: Professor, Engenheiro..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data do Batismo</label>
              <Input type="date" value={form.data_batismo} onChange={(e) => setForm({ ...form, data_batismo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data da Membresia</label>
              <Input type="date" value={form.data_membresia} onChange={(e) => setForm({ ...form, data_membresia: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Observações</label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Informações adicionais sobre o membro..." rows={3} />
            </div>
          </div>
        ) : (
          <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
            <InfoRow icon={Phone} label="Telefone" value={member.phone || "—"} />
            <InfoRow icon={MapPin} label="Endereço" value={member.endereco || "—"} />
            <InfoRow icon={Calendar} label="Nascimento" value={formatDate(member.data_nascimento)} />
            <InfoRow icon={Heart} label="Estado Civil" value={getEstadoCivilLabel(member.estado_civil)} />
            <InfoRow icon={Briefcase} label="Profissão" value={member.profissao || "—"} />
            <InfoRow icon={Calendar} label="Batismo" value={formatDate(member.data_batismo)} />
            <InfoRow icon={Calendar} label="Membresia" value={formatDate(member.data_membresia)} />
            {member.observacoes && (
              <div className="sm:col-span-2 pt-2">
                <Separator className="mb-3" />
                <InfoRow icon={FileText} label="Observações" value={member.observacoes} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
