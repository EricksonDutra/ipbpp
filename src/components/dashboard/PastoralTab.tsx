import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UserRound, Plus, BookOpen, Calendar, Search, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  full_name: string;
  phone: string | null;
  active: boolean;
}

interface PastoralRecord {
  id: string;
  pastor_id: string;
  member_id: string;
  record_type: "visita" | "aconselhamento" | "anotacao";
  title: string;
  content: string | null;
  record_date: string;
  created_at: string;
}

const RECORD_TYPE_LABELS: Record<string, string> = {
  visita: "Visita",
  aconselhamento: "Aconselhamento",
  anotacao: "Anotação",
};

const RECORD_TYPE_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  visita: "default",
  aconselhamento: "secondary",
  anotacao: "outline",
};

export function PastoralTab() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<PastoralRecord[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PastoralRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [newRecord, setNewRecord] = useState({
    record_type: "visita" as string,
    title: "",
    content: "",
    record_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [membersRes, recordsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, active").order("full_name"),
      supabase.from("pastoral_records").select("*").order("record_date", { ascending: false }),
    ]);
    setMembers(membersRes.data || []);
    setRecords((recordsRes.data as any[]) || []);
    setLoading(false);
  };

  const memberRecords = selectedMember
    ? records.filter((r) => r.member_id === selectedMember.id)
    : [];

  const filteredMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartEdit = (record: PastoralRecord) => {
    setEditingRecord(record);
    setNewRecord({
      record_type: record.record_type,
      title: record.title,
      content: record.content || "",
      record_date: record.record_date,
    });
    setShowNewRecord(true);
  };

  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !user || !newRecord.title.trim()) return;

    if (editingRecord) {
      const { error } = await supabase.from("pastoral_records").update({
        record_type: newRecord.record_type as any,
        title: newRecord.title.trim(),
        content: newRecord.content.trim() || null,
        record_date: newRecord.record_date,
      }).eq("id", editingRecord.id);

      if (error) {
        toast.error("Erro ao atualizar: " + error.message);
      } else {
        toast.success("Registro atualizado!");
        resetForm();
        fetchData();
      }
    } else {
      const { error } = await supabase.from("pastoral_records").insert({
        pastor_id: user.id,
        member_id: selectedMember.id,
        record_type: newRecord.record_type as any,
        title: newRecord.title.trim(),
        content: newRecord.content.trim() || null,
        record_date: newRecord.record_date,
      });

      if (error) {
        toast.error("Erro ao registrar: " + error.message);
      } else {
        toast.success("Registro pastoral salvo!");
        resetForm();
        fetchData();
      }
    }
  };

  const resetForm = () => {
    setNewRecord({
      record_type: "visita",
      title: "",
      content: "",
      record_date: new Date().toISOString().split("T")[0],
    });
    setShowNewRecord(false);
    setEditingRecord(null);
  };

  const handleDeleteRecord = async (id: string) => {
    const { error } = await supabase.from("pastoral_records").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir registro.");
    } else {
      toast.success("Registro excluído.");
      fetchData();
    }
  };

  const getMemberRecordCount = (memberId: string) =>
    records.filter((r) => r.member_id === memberId).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Member profile view
  if (selectedMember) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <UserRound className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-sans text-xl">{selectedMember.full_name}</CardTitle>
                  <CardDescription>
                    {selectedMember.phone || "Sem telefone"} •{" "}
                    <Badge variant={selectedMember.active ? "default" : "destructive"} className="text-xs">
                      {selectedMember.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
              <Button onClick={() => setShowNewRecord(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Novo Registro
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* New record form */}
        {showNewRecord && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="font-sans text-lg">
                {editingRecord ? "Editar Registro Pastoral" : "Novo Registro Pastoral"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRecord} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <Select
                      value={newRecord.record_type}
                      onValueChange={(v) => setNewRecord({ ...newRecord, record_type: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visita">Visita</SelectItem>
                        <SelectItem value="aconselhamento">Aconselhamento</SelectItem>
                        <SelectItem value="anotacao">Anotação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data</label>
                    <Input
                      type="date"
                      value={newRecord.record_date}
                      onChange={(e) => setNewRecord({ ...newRecord, record_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    placeholder="Ex: Visita domiciliar, Aconselhamento pré-nupcial..."
                    value={newRecord.title}
                    onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea
                    placeholder="Detalhes, anotações, acompanhamento..."
                    value={newRecord.content}
                    onChange={(e) => setNewRecord({ ...newRecord, content: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                    <Button type="submit" className="gap-1.5">
                    {editingRecord ? "Atualizar" : "Salvar Registro"}
                    </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Pastoral history */}
        <div className="space-y-3">
          <h3 className="font-sans font-bold text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Histórico Pastoral
            <Badge variant="secondary" className="ml-1">{memberRecords.length}</Badge>
          </h3>

          {memberRecords.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhum registro pastoral para este membro.
              </CardContent>
            </Card>
          ) : (
            memberRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={RECORD_TYPE_COLORS[record.record_type]}>
                        {RECORD_TYPE_LABELS[record.record_type]}
                      </Badge>
                      <span className="font-semibold text-sm">{record.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(record.record_date).toLocaleDateString("pt-BR")}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => handleStartEdit(record)}
                      >
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRecord(record.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                  {record.content && (
                    <p className="text-sm text-muted-foreground mt-1">{record.content}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // Members list view
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar membro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => {
          const count = getMemberRecordCount(member.id);
          return (
            <Card
              key={member.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedMember(member)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <UserRound className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{member.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {count > 0 ? `${count} registro${count > 1 ? "s" : ""}` : "Sem registros"}
                  </p>
                </div>
                <Badge variant={member.active ? "secondary" : "outline"} className="text-xs shrink-0">
                  {member.active ? "Ativo" : "Inativo"}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum membro encontrado.</p>
      )}
    </div>
  );
}
