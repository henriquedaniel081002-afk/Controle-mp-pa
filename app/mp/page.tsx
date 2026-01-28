"use client";

import { useMemo, useState } from "react";
import { DataTable, type Column, type SortState } from "@/components/DataTable";
import { Drawer } from "@/components/Drawer";
import { FiltersBar } from "@/components/FiltersBar";
import { StatusBadge } from "@/components/StatusBadge";
import { ScreenTabs } from "@/components/ScreenTabs";
import { useDebounce } from "@/hooks/useDebounce";
import { useEstoqueData } from "@/hooks/useEstoqueData";
import { computeEstoqueIdeal, computeMpDaysAndStatus } from "@/lib/computeDaysAndStatus";
import type { FichaTecnicaItem, MPComputed, MPItem, PAItem } from "@/lib/types";

// Exibir sempre como inteiro (sem casas decimais)
const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(Number(value) || 0);

// FC deve aparecer com 2 casas decimais (apenas na exibição)
const formatFC = (value: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(value) || 0
  );

const normalizeText = (text: string) =>
  (text || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

// Busca por múltiplos termos, sem depender da ordem.
// Ex.: query "90gm2 couche 250fls" encontra "PAPEL COUCHÉ 90GM2 250FLS".
const matchesSearch = (codigo: string, descricao: string, query: string) => {
  const q = normalizeText(query);
  if (!q) return true;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const haystack = normalizeText(`${codigo} ${descricao}`);
  return tokens.every((t) => haystack.includes(t));
};

const getSortValue = (item: MPComputed, key: string) => {
  switch (key) {
    case "cod_mp":
      return item.cod_mp;
    case "desc_mp":
      return item.desc_mp;
    case "estoque_mp":
      return item.estoque_mp;
    case "consumo_mensal_mp":
      return item.consumo_mensal_mp;
    case "status":
      return item.status;
    default:
      return item.desc_mp;
  }
};

const buildPaImpact = (ficha: FichaTecnicaItem, paMap: Record<string, PAItem>) => {
  const pa = paMap[ficha.cod_pa];
  const saidaMensal = pa?.saida_mensal_pa ?? 0;
  const estoquePa = pa?.estoque_pa ?? 0;
  const descPa = pa?.desc_pa ?? "--";
  const consumoEstimado = saidaMensal * ficha.fc;

  return {
    cod_pa: ficha.cod_pa,
    desc_pa: descPa,
    estoque_pa: estoquePa,
    saida_mensal_pa: saidaMensal,
    fc: ficha.fc,
    consumo_estimado: consumoEstimado
  };
};

export default function ControleMP() {
  const { data, isLoading, error } = useEstoqueData();
  const [selected, setSelected] = useState<MPComputed | null>(null);
  const [familia, setFamilia] = useState("");
  const [codigo, setCodigo] = useState("");
  const [status, setStatus] = useState("");
  const [gm2, setGm2] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [sort, setSort] = useState<SortState>({ key: "desc_mp", direction: "asc" });

  const mpComputed = useMemo(() => {
    if (!data) return [] as MPComputed[];
    return data.mp.map((item: MPItem) => ({
      ...item,
      ...computeMpDaysAndStatus(item),
      estoqueIdeal: computeEstoqueIdeal(item)
    }));
  }, [data]);

  const filterOptions = useMemo(() => {
    const familias = Array.from(new Set(mpComputed.map((item) => item.familia)));
    const codigos = Array.from(new Set(mpComputed.map((item) => item.cod_mp)));
    const statuses = Array.from(new Set(mpComputed.map((item) => item.status)));
    const gm2List = Array.from(new Set(mpComputed.map((item) => item.gm2)));
    return { familias, codigos, statuses, gm2List };
  }, [mpComputed]);

  const filtered = useMemo(() => {
    const term = debouncedSearch;
    return mpComputed
      .filter((item) => (familia ? item.familia === familia : true))
      .filter((item) => (codigo ? item.cod_mp === codigo : true))
      .filter((item) => (status ? item.status === status : true))
      .filter((item) => (gm2 ? item.gm2 === gm2 : true))
      .filter((item) => matchesSearch(item.cod_mp, item.desc_mp, term))
      .sort((a, b) => {
        const valueA = getSortValue(a, sort.key);
        const valueB = getSortValue(b, sort.key);
        if (valueA < valueB) return sort.direction === "asc" ? -1 : 1;
        if (valueA > valueB) return sort.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [mpComputed, familia, codigo, status, gm2, debouncedSearch, sort]);

  const paMap = useMemo(() => {
    const map: Record<string, PAItem> = {};
    data?.pa.forEach((item) => {
      map[item.cod_pa] = item;
    });
    return map;
  }, [data]);

  const paImpact = useMemo(() => {
    if (!data || !selected) return [] as ReturnType<typeof buildPaImpact>[];
    const relevant = data.fichaTecnica.filter((item) => item.cod_mp === selected.cod_mp);
    const mapped = relevant.map((item) => buildPaImpact(item, paMap));
    return mapped.reduce<Record<string, ReturnType<typeof buildPaImpact>>>((acc, item) => {
      acc[item.cod_pa] = item;
      return acc;
    }, {});
  }, [data, selected, paMap]);

  const paImpactList = useMemo(() => Object.values(paImpact), [paImpact]);

  const columns: Column<MPComputed>[] = [
    {
      key: "cod_mp",
      header: "Código MP",
      sortable: true,
      render: (row) => <span className="font-semibold text-zinc-200">{row.cod_mp}</span>
    },
    {
      key: "desc_mp",
      header: "Descrição MP",
      sortable: true,
      render: (row) => row.desc_mp
    },
    {
      key: "um",
      header: "UM",
      render: (row) => row.um
    },
    {
      key: "estoque_mp",
      header: "Estoque MP",
      sortable: true,
      render: (row) => formatNumber(row.estoque_mp)
    },
    {
      key: "consumo_mensal_mp",
      header: "Consumo mensal MP",
      sortable: true,
      render: (row) => formatNumber(row.consumo_mensal_mp)
    },
    {
      key: "estoque_ideal",
      header: "Estoque ideal (120 dias)",
      render: (row) => formatNumber(row.estoqueIdeal)
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={row.status} />
          <span className="text-xs text-zinc-400">
            {row.dias === null ? "Sem consumo" : `${row.status} - ${row.dias} dias`}
          </span>
        </div>
      )
    }
  ];

  const handleClear = () => {
    setFamilia("");
    setCodigo("");
    setStatus("");
    setGm2("");
    setSearch("");
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 sm:px-6 lg:px-10">
      <header className="mb-6">
        <p className="text-sm font-semibold text-brand-400">Controle MP</p>
        <h1 className="text-2xl font-bold text-zinc-100">Controle de Matérias-primas</h1>
        <p className="mt-1 text-sm text-zinc-400">Atualizado em {data?.updatedAt ?? "--"}</p>
        <div className="mt-4"><ScreenTabs /></div>
      </header>

      <section className="mb-6">
        <FiltersBar
          searchPlaceholder="Buscar por código ou descrição"
          searchValue={search}
          onSearchChange={setSearch}
          onClear={handleClear}
          filters={[
            {
              label: "Família",
              value: familia,
              options: filterOptions.familias.map((value) => ({ label: value, value })),
              onChange: setFamilia
            },
            {
              label: "Código MP",
              value: codigo,
              options: filterOptions.codigos.map((value) => ({ label: value, value })),
              onChange: setCodigo
            },
            {
              label: "Status",
              value: status,
              options: filterOptions.statuses.map((value) => ({ label: value, value })),
              onChange: setStatus
            },
            {
              label: "GM2",
              value: gm2,
              options: filterOptions.gm2List.map((value) => ({ label: value, value })),
              onChange: setGm2
            }
          ]}
        />
      </section>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900 p-10 text-center text-sm text-zinc-400">
          Carregando dados...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-10 text-center text-sm text-red-600">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900 p-10 text-center text-sm text-zinc-400">
          Nenhuma MP encontrada para os filtros selecionados.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          sort={sort}
          onSortChange={setSort}
          onRowClick={(row) => setSelected(row)}
        />
      )}

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Detalhes da MP ${selected.cod_mp}` : "Detalhes"}
      >
        {selected && (
          <div className="flex flex-col gap-6">
            <section className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-zinc-400">Descrição</p>
                <p className="text-sm font-semibold text-zinc-100">{selected.desc_mp}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400">Status</p>
                <div className="mt-1 flex flex-col gap-1">
                  <StatusBadge status={selected.status} />
                  <span className="text-xs text-zinc-400">
                    {selected.dias === null ? "Sem consumo" : `${selected.dias} dias`}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400">Estoque MP</p>
                <p className="text-sm font-semibold text-zinc-100">{formatNumber(selected.estoque_mp)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400">Consumo mensal</p>
                <p className="text-sm font-semibold text-zinc-100">{formatNumber(selected.consumo_mensal_mp)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400">Estoque ideal (120 dias)</p>
                <p className="text-sm font-semibold text-zinc-100">{formatNumber(selected.estoqueIdeal)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400">Família</p>
                <p className="text-sm font-semibold text-zinc-100">{selected.familia}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">PAs impactados</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">Código PA</th>
                      <th className="px-3 py-2">Descrição PA</th>
                      <th className="px-3 py-2">Estoque PA</th>
                      <th className="px-3 py-2">Saída mensal PA</th>
                      <th className="px-3 py-2">FC da MP no PA</th>
                      <th className="px-3 py-2">Consumo estimado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {paImpactList.map((item) => (
                      <tr key={item.cod_pa}>
                        <td className="px-3 py-2 font-semibold text-zinc-200">{item.cod_pa}</td>
                        <td className="px-3 py-2">{item.desc_pa}</td>
                        <td className="px-3 py-2">{formatNumber(item.estoque_pa)}</td>
                        <td className="px-3 py-2">{formatNumber(item.saida_mensal_pa)}</td>
                        <td className="px-3 py-2">{formatFC(item.fc)}</td>
                        <td className="px-3 py-2">{formatNumber(item.consumo_estimado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </Drawer>
    </main>
  );
}
