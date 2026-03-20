import { useEffect, useState } from "react";
import heroImage from "@/assets/hero-church.jpg";
import { PublicHeader } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, Clock, Heart, MapPin, Phone, Users, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BulletinSection } from "@/components/BulletinSection";
import { YouTubeLiveSection } from "@/components/YouTubeLiveSection";

const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@ipbppora";

const Index = () => {
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("notices")
      .select("*")
      .eq("category", "public")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setNotices(data || []));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <img src={heroImage} alt="Igreja Presbiteriana do Brasil - Ponta Porã" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative z-10 text-center px-4 animate-fade-in">
          <p className="text-sm uppercase tracking-[0.3em] text-primary-foreground/80 mb-4 font-sans">
            Igreja Presbiteriana do Brasil
          </p>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-primary-foreground mb-4 leading-tight">
            IPB Ponta Porã
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-xl mx-auto mb-8 font-light">
            "Porque onde estiverem dois ou três reunidos em meu nome, ali estou no meio deles." — Mateus 18:20
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#cultos">
              <Button size="lg" variant="secondary" className="font-semibold">
                Nossos Cultos
              </Button>
            </a>
            <Link to="/membros">
              <Button size="lg" variant="outline" className="border-2 border-white text-white bg-white/10 hover:bg-white/20">
                Área do Membro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Avisos Públicos */}
      {notices.length > 0 && (
        <section className="py-12 bg-primary/5">
          <div className="container">
            <h2 className="text-2xl font-serif font-bold text-center mb-6 flex items-center justify-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" /> Avisos
            </h2>
            <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
              {notices.map((n) => (
                <Card key={n.id} className="border-primary/20">
                  <CardContent className="p-5">
                    <h3 className="font-serif font-bold mb-1">{n.title}</h3>
                    <p className="text-sm text-muted-foreground">{n.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(n.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sobre */}
      <section id="sobre" className="py-20 bg-section-warm">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-4">Bem-vindo à nossa Igreja</h2>
            <p className="text-muted-foreground leading-relaxed">
              Somos uma comunidade de fé comprometida com os princípios da Reforma Protestante,
              pregando fielmente as Escrituras e servindo a comunidade de Ponta Porã e região.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: BookOpen, title: "Fidelidade Bíblica", desc: "Pregação expositiva e ensino fundamentado nas Escrituras Sagradas." },
              { icon: Users, title: "Comunhão", desc: "Uma família unida em Cristo, onde todos são acolhidos com amor." },
              { icon: Heart, title: "Serviço", desc: "Comprometidos em servir a comunidade com ações sociais e missionárias." },
            ].map((item) => (
              <Card key={item.title} className="text-center border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-serif font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cultos */}
      <section id="cultos" className="py-20">
        <div className="container">
          <h2 className="text-3xl font-serif font-bold text-center mb-12">Nossos Cultos</h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-3xl mx-auto">
            {[
              { day: "Domingo", time: "9h00", name: "Escola Bíblica Dominical" },
              { day: "Domingo", time: "19h00", name: "Culto Vespertino" },
              { day: "Terça-feira", time: "19h30", name: "Culto de Oração" },
            ].map((culto) => (
              <Card key={culto.name} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Clock className="h-6 w-6 text-accent mx-auto mb-3" />
                  <h3 className="font-serif font-bold mb-1">{culto.name}</h3>
                  <p className="text-sm text-muted-foreground">{culto.day}</p>
                  <p className="text-2xl font-bold text-primary mt-2">{culto.time}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Boletim Semanal & Mensagem Pastoral */}
      <BulletinSection />

      {/* Transmissões ao Vivo - YouTube */}
      <YouTubeLiveSection channelUrl={YOUTUBE_CHANNEL_URL} />

      {/* Contato + Mapa */}
      <section id="contato" className="py-20 bg-section-warm">
        <div className="container">
          <h2 className="text-3xl font-serif font-bold text-center mb-10">Visite-nos</h2>
          <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto items-start">
            {/* Informações */}
            <div className="space-y-6 text-center lg:text-left">
              <p className="text-muted-foreground">
                Estamos de portas abertas para recebê-lo. Venha nos fazer uma visita!
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 justify-center lg:justify-start">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-sans font-semibold text-sm">Endereço</p>
                    <p className="text-sm text-muted-foreground">Rua Duque de Caxias, 495 - Centro</p>
                    <p className="text-sm text-muted-foreground">Ponta Porã - MS, Brasil</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-center lg:justify-start">
                  <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-sans font-semibold text-sm">Contato</p>
                    <p className="text-sm text-muted-foreground">contato@ipbpontapora.org.br</p>
                  </div>
                </div>
              </div>
              <Link to="/visitante">
                <Button className="gap-2 mt-2">
                  <Users className="h-4 w-4" /> Registrar Visita
                </Button>
              </Link>
            </div>
            {/* Google Maps */}
            <div className="rounded-xl overflow-hidden shadow-lg border">
              <iframe
                title="Localização da IPB Ponta Porã"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3621.0!2d-55.7258!3d-22.5362!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sRua+Duque+de+Caxias%2C+495+-+Centro%2C+Ponta+Por%C3%A3+-+MS!5e0!3m2!1spt-BR!2sbr!4v1"
                width="100%"
                height="350"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
