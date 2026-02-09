import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Church, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: "Início" },
    { to: "/#sobre", label: "Sobre" },
    { to: "/#cultos", label: "Cultos" },
    { to: "/#contato", label: "Contato" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Church className="h-7 w-7 text-primary" />
          <div className="leading-tight">
            <span className="block text-sm font-bold font-serif text-primary">IPB Ponta Porã</span>
            <span className="block text-[10px] text-muted-foreground">Igreja Presbiteriana do Brasil</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a key={l.to} href={l.to} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {l.label}
            </a>
          ))}
          <Link to="/membros">
            <Button size="sm">Área do Membro</Button>
          </Link>
        </nav>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4 space-y-3">
          {links.map((l) => (
            <a key={l.to} href={l.to} className="block text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
              {l.label}
            </a>
          ))}
          <Link to="/membros" onClick={() => setMobileOpen(false)}>
            <Button size="sm" className="w-full">Área do Membro</Button>
          </Link>
        </div>
      )}
    </header>
  );
}

export function MemberHeader() {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-primary">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Church className="h-6 w-6 text-primary-foreground" />
          <span className="text-sm font-bold font-serif text-primary-foreground">Área do Membro</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            Voltar ao site
          </Link>
          <button onClick={logout} className="flex items-center gap-1 text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
      </div>
    </header>
  );
}
