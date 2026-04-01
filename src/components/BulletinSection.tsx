import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, BookOpen } from "lucide-react";

interface Bulletin {
  id: string;
  title: string;
  pastoral_message: string | null;
  bulletin_pdf_url: string | null;
  published_at: string;
}

const PREVIEW_LENGTH = 200;

export function BulletinSection() {
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [showFullMessage, setShowFullMessage] = useState(false);

  useEffect(() => {
    supabase
      .from("weekly_bulletins")
      .select("*")
      .eq("active", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setBulletin(data[0] as any);
      });
  }, []);

  if (!bulletin) return null;

  const pdfPublicUrl = bulletin.bulletin_pdf_url
    ? supabase.storage.from("bulletins").getPublicUrl(bulletin.bulletin_pdf_url).data.publicUrl
    : null;

  const message = bulletin.pastoral_message || "";
  const isLong = message.length > PREVIEW_LENGTH;
  const preview = isLong ? message.slice(0, PREVIEW_LENGTH).trimEnd() + "…" : message;

  return (
    <aside className="py-16 bg-background">
      <div className="container max-w-4xl">
        <h2 className="text-2xl font-serif font-bold text-center mb-8 flex items-center justify-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Boletim Semanal
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Bulletin PDF */}
          <Card className="border-primary/20 shadow-md">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg mb-1">{bulletin.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(bulletin.published_at + "T00:00:00").toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              {pdfPublicUrl ? (
                <a href={pdfPublicUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2">
                    <Download className="h-4 w-4" /> Baixar Boletim
                  </Button>
                </a>
              ) : (
                <p className="text-sm text-muted-foreground italic">PDF não disponível</p>
              )}
            </CardContent>
          </Card>

          {/* Pastoral message */}
          {message && (
            <Card className="border-primary/20 shadow-md">
              <CardContent className="p-6">
                <h3 className="font-serif font-bold text-lg mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Mensagem Pastoral
                </h3>
                <Separator className="mb-4" />
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {preview}
                </p>
                {isLong && (
                  <Button
                    variant="link"
                    className="mt-2 px-0 h-auto text-primary font-semibold"
                    onClick={() => setShowFullMessage(true)}
                  >
                    Leia mais
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Full message dialog */}
      <Dialog open={showFullMessage} onOpenChange={setShowFullMessage}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Mensagem Pastoral
            </DialogTitle>
          </DialogHeader>
          <Separator className="my-2" />
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {message}
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}