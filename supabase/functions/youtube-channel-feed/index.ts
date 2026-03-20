import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const CHANNEL_HANDLE = "@ipbppora";
const CHANNEL_URL = `https://www.youtube.com/${CHANNEL_HANDLE}`;
const STREAMS_URL = `${CHANNEL_URL}/streams`;

type YoutubeRenderer = Record<string, unknown>;

type YoutubeVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  publishedText?: string;
  watchUrl: string;
  isLive: boolean;
  isUpcoming: boolean;
};

const normalizeUrl = (url: string | undefined, fallback: string) => {
  if (!url) return fallback;
  if (url.startsWith("//")) return `https:${url}`;
  return url;
};

const resolveText = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  if (typeof record.simpleText === "string") return record.simpleText;

  if (Array.isArray(record.runs)) {
    return record.runs
      .map((item) => (typeof item === "object" && item && "text" in item ? String((item as Record<string, unknown>).text ?? "") : ""))
      .join("");
  }

  return "";
};

const extractBalancedJson = (source: string, marker: string) => {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) return null;

  const jsonStart = source.indexOf("{", markerIndex + marker.length);
  if (jsonStart === -1) return null;

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = jsonStart; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(jsonStart, index + 1);
      }
    }
  }

  return null;
};

const collectVideoRenderers = (value: unknown, results: YoutubeRenderer[] = []) => {
  if (!value || typeof value !== "object") return results;

  if (Array.isArray(value)) {
    value.forEach((item) => collectVideoRenderers(item, results));
    return results;
  }

  const record = value as Record<string, unknown>;

  if (record.videoRenderer && typeof record.videoRenderer === "object") {
    results.push(record.videoRenderer as YoutubeRenderer);
  }

  if (record.gridVideoRenderer && typeof record.gridVideoRenderer === "object") {
    results.push(record.gridVideoRenderer as YoutubeRenderer);
  }

  Object.values(record).forEach((item) => collectVideoRenderers(item, results));
  return results;
};

const includesKeyword = (value: string, keywords: string[]) => {
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
};

const parseVideo = (renderer: YoutubeRenderer): YoutubeVideo | null => {
  const videoId = typeof renderer.videoId === "string" ? renderer.videoId : null;
  if (!videoId) return null;

  const thumbnails = (((renderer.thumbnail as Record<string, unknown> | undefined)?.thumbnails) as Array<Record<string, unknown>> | undefined) ?? [];
  const thumbnail = thumbnails[thumbnails.length - 1];
  const thumbnailUrl = normalizeUrl(
    typeof thumbnail?.url === "string" ? thumbnail.url : undefined,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  );

  const title = resolveText(renderer.title);
  const publishedText = resolveText(renderer.publishedTimeText);

  const badges = Array.isArray(renderer.badges) ? renderer.badges : [];
  const badgeStyles = badges
    .map((badge) => {
      if (!badge || typeof badge !== "object") return "";
      const metadataBadgeRenderer = (badge as Record<string, unknown>).metadataBadgeRenderer;
      if (!metadataBadgeRenderer || typeof metadataBadgeRenderer !== "object") return "";
      return String((metadataBadgeRenderer as Record<string, unknown>).style ?? "");
    })
    .filter(Boolean);

  const overlayTexts = (Array.isArray(renderer.thumbnailOverlays) ? renderer.thumbnailOverlays : [])
    .map((overlay) => {
      if (!overlay || typeof overlay !== "object") return "";
      const statusRenderer = (overlay as Record<string, unknown>).thumbnailOverlayTimeStatusRenderer;
      if (!statusRenderer || typeof statusRenderer !== "object") return "";
      return `${String((statusRenderer as Record<string, unknown>).style ?? "")} ${resolveText((statusRenderer as Record<string, unknown>).text)}`;
    })
    .filter(Boolean);

  const isLive =
    badgeStyles.some((style) => includesKeyword(style, ["live"])) ||
    overlayTexts.some((text) => includesKeyword(text, ["live", "ao vivo"]));

  const isUpcoming =
    Boolean(renderer.upcomingEventData) ||
    badgeStyles.some((style) => includesKeyword(style, ["upcoming"])) ||
    overlayTexts.some((text) => includesKeyword(text, ["upcoming", "scheduled", "agendad"]));

  return {
    videoId,
    title: title || "Transmissão da igreja",
    thumbnailUrl,
    publishedText,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    isLive,
    isUpcoming,
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const response = await fetch(STREAMS_URL, {
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Falha ao consultar o YouTube [${response.status}]`);
    }

    const html = await response.text();
    const jsonPayload =
      extractBalancedJson(html, "var ytInitialData = ") ??
      extractBalancedJson(html, 'window["ytInitialData"] = ');

    if (!jsonPayload) {
      throw new Error("Não foi possível localizar os dados públicos do canal no YouTube");
    }

    const parsed = JSON.parse(jsonPayload);
    const renderers = collectVideoRenderers(parsed);
    const seen = new Set<string>();
    const videos: YoutubeVideo[] = [];

    renderers.forEach((renderer) => {
      const video = parseVideo(renderer);
      if (!video || seen.has(video.videoId)) return;
      seen.add(video.videoId);
      videos.push(video);
    });

    const live = videos.find((video) => video.isLive) ?? null;
    const recent = videos.filter((video) => !video.isLive && !video.isUpcoming).slice(0, 3);

    return new Response(
      JSON.stringify({
        live: live ? {
          videoId: live.videoId,
          title: live.title,
          thumbnailUrl: live.thumbnailUrl,
          publishedText: live.publishedText,
          watchUrl: live.watchUrl,
        } : null,
        recent: recent.map((video) => ({
          videoId: video.videoId,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          publishedText: video.publishedText,
          watchUrl: video.watchUrl,
        })),
        channelUrl: CHANNEL_URL,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("youtube-channel-feed error:", error);

    return new Response(
      JSON.stringify({
        live: null,
        recent: [],
        channelUrl: CHANNEL_URL,
        error: error instanceof Error ? error.message : "Erro inesperado ao consultar o YouTube",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
