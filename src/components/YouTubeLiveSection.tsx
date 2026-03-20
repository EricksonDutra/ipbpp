import { useEffect, useState } from "react";
import { ExternalLink, Radio, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface YoutubeVideo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  publishedText?: string;
  watchUrl: string;
}

interface YoutubeFeedResponse {
  live: YoutubeVideo | null;
  recent: YoutubeVideo[];
  channelUrl: string;
  error?: string;
}

const openExternalLink = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

export const YouTubeLiveSection = ({ channelUrl }: { channelUrl: string }) => {
  const [feed, setFeed] = useState<YoutubeFeedResponse>({
    live: null,
    recent: [],
    channelUrl,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadYoutubeFeed = async () => {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke<YoutubeFeedResponse>("youtube-channel-feed", {
        body: {},
      });

      if (!isMounted) return;

      if (error) {
        setFeed({ live: null, recent: [], channelUrl });
        setErrorMessage("Não foi possível carregar as transmissões agora.");
        setIsLoading(false);
        return;
      }

      setFeed({
        live: data?.live ?? null,
        recent: data?.recent?.slice(0, 3) ?? [],
        channelUrl: data?.channelUrl ?? channelUrl,
      });
      setErrorMessage(data?.error ?? null);
      setIsLoading(false);
    };

    loadYoutubeFeed();

    return () => {
      isMounted = false;
    };
  }, [channelUrl]);

  return (
    <section className="py-20 bg-section-warm">
      <div className="container">
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <Youtube className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-2">Transmissões no YouTube</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Veja as últimas 3 transmissões e acompanhe o destaque automático quando houver culto ao vivo.
          </p>
        </div>

        {feed.live && (
          <Card className="mb-8 overflow-hidden border-destructive/30 shadow-xl">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="relative aspect-video bg-muted">
                <img
                  src={feed.live.thumbnailUrl}
                  alt={feed.live.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-4 top-4">
                  <Badge className="gap-2 bg-destructive text-destructive-foreground">
                    <Radio className="h-3.5 w-3.5 animate-pulse" />
                    Ao vivo agora
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col justify-center p-6 lg:p-8">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-destructive mb-3">
                  Destaque da transmissão
                </p>
                <h3 className="text-2xl font-serif font-bold leading-tight mb-3 text-balance">
                  {feed.live.title}
                </h3>
                <p className="text-muted-foreground mb-6 text-pretty">
                  A transmissão está acontecendo neste momento. Abra no YouTube para assistir sem o bloqueio do preview.
                </p>
                <div>
                  <Button
                    type="button"
                    variant="destructive"
                    className="gap-2"
                    onClick={() => openExternalLink(feed.live?.watchUrl ?? feed.channelUrl)}
                  >
                    <Youtube className="h-4 w-4" />
                    Assistir agora
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-end justify-between gap-4 mb-6 flex-col sm:flex-row">
          <div>
            <h3 className="text-2xl font-serif font-bold">Últimas transmissões</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Conteúdo mais recente do canal oficial da igreja.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => openExternalLink(feed.channelUrl)}
          >
            <ExternalLink className="h-4 w-4" />
            Abrir canal no YouTube
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border shadow-sm">
                <div className="aspect-video animate-pulse bg-muted" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : feed.recent.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {feed.recent.map((video) => (
              <Card key={video.videoId} className="group overflow-hidden border shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-4">
                  <h4 className="font-sans text-base font-semibold leading-snug line-clamp-2 min-h-[3.25rem] text-balance">
                    {video.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-2 min-h-5">
                    {video.publishedText || "Canal oficial da igreja"}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-4 px-0 text-primary hover:bg-transparent hover:text-primary/80"
                    onClick={() => openExternalLink(video.watchUrl)}
                  >
                    Assistir no YouTube
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                {errorMessage || "Ainda não foi possível carregar as transmissões."}
              </p>
              <Button type="button" variant="outline" className="gap-2" onClick={() => openExternalLink(feed.channelUrl)}>
                <Youtube className="h-4 w-4" />
                Ver canal no YouTube
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};
