import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, FileText, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface BulletinRow {
  id: string;
  title: string;
  pastoral_message: string | null;
  bulletin_pdf_url: string | null;
  published_at: string;
  active: boolean;
  created_at: string;
}

export function BulletinManagement() {
  const [bulletins, setBulletins] = useState<BulletinRow[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<BulletinRow | null>(null);
  const [form, setForm] = useState({ title: "", pastoral_message: "", published_at: new Date().toISOString().split("T")[0] });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchBulletins(); }, []);

  const fetchBulletins = async () => {
    const { data } = await supabase
      .from("weekly_bulletins")
      .select("*")
      .order("published_at", { ascending: false });
    setBulletins((data as any[]) || []);
  };

  const openDialog = (row?: BulletinRow) => {
    if (row) {
      setEditing(row);
      setForm({ title: row.title, pastoral_message: row.pastoral_message || "", published_at: row.published_at });
    } else {
      setEditing(null);
      setForm({ title: "", pastoral_message: "", published_at: new Date().toISOString().split("T")[0] });
    }
    setSelectedFile(null);
    setShowDialog(true);
  };

  const uploadPdf = async (bulletinId: string): Promise<string | null> => {
    if (!selectedFile) return null;
    const filePath = `${bulletinId}.pdf`;
    await supabase.storage.from("bulletins").remove([filePath]);
    const { error } = await supabase.storage.from("bulletins").upload(filePath, selectedFile, { upsert: true });
    if (error) { toast.error("Erro no upload: " + error.message); return null; }
    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);

    if (editing) {
      let pdfUrl = editing.bulletin_pdf_url;
      if (selectedFile) {
        const url = await uploadPdf(editing.id);
        if (url) pdfUrl = url;
      }
      const { error } = await supabase.from("weekly_bulletins").update({
        title: form.title.trim(),
        pastoral_message: form.pastoral_message.trim() || null,
        published_at: form.published_at,
        bulletin_pdf_url: pdfUrl,
      } as any).eq("id", editing.id);
      if (error) toast.error("Erro: " + error.message);
      else toast.success("Boletim atualizado!");
    } else {
      const { data: inserted, error } = await supabase.from("weekly_bulletins").insert({
        title: form.title.trim(),
        pastoral_message: form.pastoral_message.trim() || null,
        published_at: form.published_at,
      } as any).select("id").single();
      if (error) { toast.error("Erro: " + error.message); }
      else {
        if (selectedFile && inserted) {
          const url = await uploadPdf(inserted.id);
          if (url) {
            await supabase.from("weekly_bulletins").update({ bulletin_pdf_url: url } as any).eq("id", inserted.id);
          }
        }
        toast.success("Boletim publicado!");
      }
    }
    setSubmitting(false);
    setShowDialog(false);
    fetchBulletins();
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("weekly_bulletins").update({ active } as any).eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success(active ? "Boletim ativado!" : "Boletim desativado!"); fetchBulletins(); }
  };

  const deleteBulletin = async (row: BulletinRow) => {
    if (row.bulletin_pdf_url) {
      await supabase.storage.from("bulletins").remove([row.bulletin_pdf_url]);
    }
    const { error } = await supabase.from("weekly_bulletins").delete().eq("id", row.id);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Boletim excluído!"); fetchBulletins(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openDialog()} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Boletim
        </Button>
      </div>

      {bulletins.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum boletim publicado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bulletins.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{b.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.published_at + "T00:00:00").toLocaleDateString("pt-BR")}
                      {b.bulletin_pdf_url && " • PDF anexado"}
                      {b.pastoral_message && " • Mensagem pastoral"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={b.active ? "default" : "outline"} className="text-xs">
                    {b.active ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(b.id, !b.active)}>
                    {b.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openDialog(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteBulletin(b)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Boletim" : "Novo Boletim Semanal"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                placeholder="Ex: Boletim Dominical - 16/03/2026"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Publicação</label>
              <Input
                type="date"
                value={form.published_at}
                onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Arquivo PDF do Boletim</label>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
                  <Upload className="h-4 w-4" /> {selectedFile ? selectedFile.name : (editing?.bulletin_pdf_url ? "Substituir PDF" : "Selecionar PDF")}
                </Button>
                {selectedFile && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem Pastoral</label>
              <Textarea
                placeholder="Escreva a mensagem pastoral da semana..."
                value={form.pastoral_message}
                onChange={(e) => setForm({ ...form, pastoral_message: e.target.value })}
                rows={6}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : editing ? "Atualizar" : "Publicar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
