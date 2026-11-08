// About: what the explorer is, how it is wired, sources and photo credits.
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LTSER_AREAS, NETWORKS } from "@/lib/catalog";
import { AREA_PHOTOS } from "@/lib/photos";
import { loadNetworks } from "@/lib/geo";
import { useAsync } from "@/hooks/use-async";
import { useBackend } from "@/hooks/use-backend";
import { glyphSvg } from "@/components/map/glyphs";
import { PageHeader } from "@/components/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/misc";
import type { ViewProps } from "@/explorer-routes";

function ServiceRow({ name, label }: { name: "lifewatch" | "ltser"; label: string }) {
  const { t } = useI18n();
  const s = useBackend(name);
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-[13px] font-medium">{label}</td>
      <td className="tabular px-4 py-3 text-xs text-muted">{s.baseUrl}</td>
      <td className="px-4 py-3">
        <Badge variant={s.mode === "live" ? "live" : s.mode === "demo" ? "demo" : "neutral"}>
          <StatusDot mode={s.mode} />
          {t(`source.${s.mode}`)}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-muted">{s.reason ? t(`about.reason.${s.reason}`) : ""}{s.latencyMs !== null ? ` · ${s.latencyMs} ms` : ""}</td>
    </tr>
  );
}

export default function About(_: ViewProps) {
  const { t, L } = useI18n();
  const nets = useAsync(() => loadNetworks(), []);
  const sections = [
    { title: t("nav.rs"), body: t("about.s1") },
    { title: t("nav.net"), body: t("about.s2") },
    { title: t("nav.platform"), body: t("about.s3") },
    { title: t("nav.social"), body: t("about.s4") },
  ];
  const sources = [
    ["https://github.com/alexdum/ltser", "github.com/alexdum/ltser", t("about.src.ltser")],
    ["https://github.com/GabrielMajeri/lifewatch-romania", "github.com/GabrielMajeri/lifewatch-romania", t("about.src.lifewatch")],
    ["https://lifewatch.ro", "lifewatch.ro", t("about.src.lw")],
    ["https://www.icos-etc.eu/icos/documents/instructions/", "icos-etc.eu", t("about.src.icos")],
    ["http://statistici.roda.ro/", "statistici.roda.ro", t("about.src.roda")],
  ];
  return (
    <div className="grid gap-4">
      <PageHeader crumbs={[t("nav.about")]} title={t("about.title")} description={t("about.lede")} />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="divide-y divide-border">
          {sections.map((s, i) => (
            <div key={s.title} className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 p-4">
              <span className="tabular text-sm text-subtle">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="text-[14px] font-semibold tracking-tight">{s.title}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{s.body}</p>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <CardHeader title={t("about.networks")} description={t("about.networksNote")} />
          <ul className="border-t border-border">
            {NETWORKS.map((n) => (
              <li key={n.id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-[13px] last:border-0">
                <span className="inline-flex" dangerouslySetInnerHTML={{ __html: glyphSvg(n.shape, n.color, 14) }} />
                <span className="flex-1 text-muted">{L(n)}</span>
                <span className="tabular font-medium">{nets.data?.[n.id].features.length ?? ""}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title={t("about.wiring")} description={t("about.wiringSub")} />
        <CardBody className="grid gap-3">
          <p className="max-w-[80ch] text-[13px] leading-relaxed text-muted">{t("about.wiringText")}</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left">
              <thead className="bg-surface-2 text-[11px] text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">{t("about.col.service")}</th>
                  <th className="px-4 py-2 font-medium">{t("about.col.url")}</th>
                  <th className="px-4 py-2 font-medium">{t("about.col.mode")}</th>
                  <th className="px-4 py-2 font-medium">{t("about.col.reason")}</th>
                </tr>
              </thead>
              <tbody>
                <ServiceRow name="lifewatch" label={t("about.backend.lifewatch")} />
                <ServiceRow name="ltser" label={t("about.backend.ltser")} />
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-subtle">{t("about.modeHint", { file: "runtime-config.js" })}</p>
        </CardBody>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("about.sources")} />
          <ul className="border-t border-border">
            {sources.map(([href, label, body]) => (
              <li key={href} className="border-b border-border last:border-0">
                <a href={href} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 px-4 py-2.5 hover:bg-surface-2/60">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">{label}</span>
                    <span className="block text-xs text-muted">{body}</span>
                  </span>
                  <ArrowUpRight className="mt-0.5 size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.75} />
                </a>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title={t("about.photos")} description={t("about.photosNote")} />
          <ul className="border-t border-border">
            {Object.entries(AREA_PHOTOS).map(([id, p]) => (
              <li key={id} className="border-b border-border last:border-0">
                <a href={p.page} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-surface-2/60">
                  <span className="flex-1 truncate">{L(LTSER_AREAS[Number(id)])}</span>
                  <span className="truncate text-xs text-muted">{p.author} · {p.location}</span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-subtle" strokeWidth={1.75} />
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
