import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "../router";
import { Container } from "../components/primitives";
import { PageMotionGraphic } from "../components/page-motion";

export default function NotFoundPage() {
  return (
    <Container className="grid min-h-[60vh] place-items-center py-20">
      <div className="grid justify-items-center gap-4 text-center">
        <PageMotionGraphic scene={{ kind: "not-found" }} className="aspect-[5/2] w-full max-w-[320px]" />
        <p className="tabular text-[13px] text-subtle">404</p>
        <h1 className="text-[34px] leading-tight font-semibold tracking-tight">Pagina nu există</h1>
        <p className="max-w-[44ch] text-[15px] text-muted">Adresa poate fi greșită sau pagina a fost mutată. Folosiți căutarea din antet sau porniți de la pagina principală.</p>
        <Button asChild variant="primary" size="lg" className="mt-2">
          <Link to="">
            Pagina principală
            <ArrowRight strokeWidth={1.75} />
          </Link>
        </Button>
      </div>
    </Container>
  );
}
