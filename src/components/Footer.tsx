import ipbLogo from "@/assets/ipb-logo.png";

export function Footer() {
  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src={ipbLogo} alt="Logo IPB" className="h-10 w-10 object-contain brightness-0 invert" />
              <span className="font-serif font-bold">IPB Ponta Porã</span>
            </div>
            <p className="text-sm text-primary-foreground/70">
              Igreja Presbiteriana do Brasil em Ponta Porã - MS. Proclamando o Evangelho de Cristo com fidelidade.
            </p>
          </div>
          <div>
            <h4 className="font-serif font-bold mb-3">Horários</h4>
            <ul className="space-y-1 text-sm text-primary-foreground/70">
              <li>Domingo: 9h e 19h</li>
              <li>Quarta-feira: 19h30</li>
              <li>EBD: Domingo 8h</li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif font-bold mb-3">Contato</h4>
            <ul className="space-y-1 text-sm text-primary-foreground/70">
              <li>Ponta Porã, MS - Brasil</li>
              <li>contato@ipbpontapora.org.br</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-primary-foreground/20 text-center text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Igreja Presbiteriana do Brasil - Ponta Porã. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
