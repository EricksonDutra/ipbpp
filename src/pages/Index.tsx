import heroImage from "@/assets/hero-church.jpg";
import { PublicHeader } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, Clock, Heart, MapPin, Phone, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <img src={heroImage} alt="Igreja Presbiteriana do Brasil - Ponta Porã" className="absolute inset-0 w-full h-full object-cover" />
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
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Área do Membro
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
              { day: "Domingo", time: "9h00", name: "Culto Matutino" },
              { day: "Domingo", time: "19h00", name: "Culto Vespertino" },
              { day: "Quarta-feira", time: "19h30", name: "Culto de Oração" },
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

      {/* Contato */}
      <section id="contato" className="py-20 bg-section-warm">
        <div className="container max-w-2xl text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">Visite-nos</h2>
          <p className="text-muted-foreground mb-8">
            Estamos de portas abertas para recebê-lo. Venha nos fazer uma visita!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Ponta Porã, MS - Brasil</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 text-primary" />
              <span>contato@ipbpontapora.org.br</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
