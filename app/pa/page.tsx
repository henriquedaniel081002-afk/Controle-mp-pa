"use client";

import { useMemo, useState } from "react";
import { DataTable, type Column, type SortState } from "@/components/DataTable";
import { Drawer } from "@/components/Drawer";
import { FiltersBar } from "@/components/FiltersBar";
import { StatusBadge } from "@/components/StatusBadge";
import { ScreenTabs } from "@/components/ScreenTabs";
import { useDebounce } from "@/hooks/useDebounce";
import { useEstoqueData } from "@/hooks/useEstoqueData";
import { computePaDaysAndStatus } from "@/lib/computeDaysAndStatus";
import type { FichaTecnicaItem, MPItem, PAComputed, PAItem } from "@/lib/types";

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

const getSortValue = (item: PAComputed, key: string) => {
  switch (key) {
    case "rank":
      return item.rank;
    case "cod_pa":
      return item.cod_pa;
    case "desc_pa":
      return item.desc_pa;
    case "estoque_pa":
      return item.estoque_pa;
    case "saida_mensal_pa":
      return item.saida_mensal_pa;
    case "consumo_mensal_mp":
      return item.consumo_mensal_mp;
    case "status":
      return item.status;
    default:
      return item.cod_pa;
  }
};

const joinFichaTecnica = (ficha: FichaTecnicaItem, mpMap: Record<string, MPItem>) => {
  const mp = mpMap[ficha.cod_mp];
  const estoqueMp = mp?.estoque_mp ?? 0;
  const consumoMensal = mp?.consumo_mensal_mp ?? 0;
  // Quantidade produzível em unidades (inteiro)
  const quantProduzivel = ficha.fc > 0 ? Math.floor(estoqueMp / ficha.fc) : 0;

  return {
    ...ficha,
    estoque_mp: estoqueMp,
    consumo_mensal_mp: consumoMensal,
    quant_produzivel: quantProduzivel
  };
};

export default function ControlePA() {
  const { data, isLoading, error } = useEstoqueData();
  const [selected, setSelected] = useState<PAComputed | null>(null);
  const [familia, setFamilia] = useState("");
  const [codigo, setCodigo] = useState("");
  const [status, setStatus] = useState("");
  const [gm2, setGm2] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [sort, setSort] = useState<SortState>({ key: "rank", direction: "asc" });

  const paComputed = useMemo(() => {
    if (!data) return [] as PAComputed[];
    return data.pa.map((item: PAItem) => ({ ...item, ...computePaDaysAndStatus(item) }));
  }, [data]);

  const filterOptions = useMemo(() => {
    const familias = Array.from(new Set(paComputed.map((item) => item.familia)));
    const codigos = Array.from(new Set(paComputed.map((item) => item.cod_pa)));
    const statuses = Array.from(new Set(paComputed.map((item) => item.status)));
    const gm2List = Array.from(new Set(paComputed.map((item) => item.gm2)));
    return { familias, codigos, statuses, gm2List };
  }, [paComputed]);

  const filtered = useMemo(() => {
    const term = debouncedSearch;
    return paComputed
      .filter((item) => (familia ? item.familia === familia : true))
      .filter((item) => (codigo ? item.cod_pa === codigo : true))
      .filter((item) => (status ? item.status === status : true))
      .filter((item) => (gm2 ? item.gm2 === gm2 : true))
      .filter((item) => matchesSearch(item.cod_pa, item.desc_pa, term))
      .sort((a, b) => {
        const valueA = getSortValue(a, sort.key);
        const valueB = getSortValue(b, sort.key);
        if (valueA < valueB) return sort.direction === "asc" ? -1 : 1;
        if (valueA > valueB) return sort.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [paComputed, familia, codigo, status, gm2, debouncedSearch, sort]);

  const mpMap = useMemo(() => {
    const map: Record<string, MPItem> = {};
    data?.mp.forEach((item) => {
      map[item.cod_mp] = item;
    });
    return map;
  }, [data]);

  const fichaForSelected = useMemo(() => {
    if (!data || !selected) return [] as ReturnType<typeof joinFichaTecnica>[];
    return data.fichaTecnica
      .filter((item) => item.cod_pa === selected.cod_pa)
      .map((item) => joinFichaTecnica(item, mpMap));
  }, [data, selected, mpMap]);

  const capacidade = useMemo(() => {
    if (fichaForSelected.length === 0) return null;
    const minItem = fichaForSelected.reduce((prev, curr) =>
      curr.quant_produzivel < prev.quant_produzivel ? curr : prev
    );
    return minItem;
  }, [fichaForSelected]);

  const columns: Column<PAComputed>[] = [
    {
      key: "rank",
      header: "Rank",
      sortable: true,
      render: (row) => <span className="font-semibold text-zinc-200">{row.rank}</span>
    },
    {
      key: "cod_pa",
      header: "Código PA",
      sortable: true,
      render: (row) => row.cod_pa
    },
    {
      key: "desc_pa",
      header: "Descrição PA",
      sortable: true,
      render: (row) => row.desc_pa
    },
    {
      key: "um",
      header: "UM",
      render: (row) => row.um
    },
    {
      key: "fc",
      header: "FC",
      render: (row) => formatFC(row.fc)
    },
    {
      key: "estoque_pa",
      header: "Estoque PA",
      sortable: true,
      render: (row) => formatNumber(row.estoque_pa)
    },
    {
      key: "saida_mensal_pa",
      header: "Saída mensal",
      sortable: true,
      render: (row) => formatNumber(row.saida_mensal_pa)
    },
    {
      key: "consumo_mensal_mp",
      header: "Consumo mensal MP",
      sortable: true,
      render: (row) => formatNumber(row.consumo_mensal_mp)
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
        <p className="text-sm font-semibold text-brand-400">Controle PA</p>
        <h1 className="text-2xl font-bold text-zinc-100">Controle de Produtos Acabados</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Atualizado em {data?.updatedAt ?? "--"}
        </p>
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
              label: "Código PA",
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
          Nenhum PA encontrado para os filtros selecionados.
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
        title={selected ? `Detalhes do PA ${selected.cod_pa}` : "Detalhes"}
      >
        {selected && (
          <div className="flex flex-col gap-6">
            <section className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-zinc-400">Descrição</p>
                <p className="text-sm font-semibold text-zinc-100">{selected.desc_pa}</p>
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
                <p className="text-xs font-semibold text-zinc-400">Estoque PA</p>
                <p className="text-sm font-semibold text-zinc-100">{formatNumber(selected.estoque_pa)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400">Saída mensal</p>
                <p className="text-sm font-semibold text-zinc-100">{formatNumber(selected.saida_mensal_pa)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400">Consumo mensal MP</p>
                <p className="text-sm font-semibold text-zinc-100">{formatNumber(selected.consumo_mensal_mp)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400">Família</p>
                <p className="text-sm font-semibold text-zinc-100">{selected.familia}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">MPs/insumos do PA</h3>

              {/* Mobile: cards (sem scroll interno) */}
              <div className="mt-3 space-y-3 md:hidden">
                {fichaForSelected.map((item) => (
                  <div
                    key={item.cod_mp}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-400">Código MP</p>
                        <p className="text-sm font-semibold text-zinc-100">{item.cod_mp}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-zinc-400">UM</p>
                        <p className="text-sm font-semibold text-zinc-100">{item.um}</p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="text-xs font-semibold text-zinc-400">Descrição MP</p>
                      <p className="text-sm text-zinc-100 break-words whitespace-normal">
                        {item.desc_mp}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-zinc-400">FC</p>
                        <p className="text-sm font-semibold text-zinc-100">{formatFC(item.fc)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-400">Estoque MP</p>
                        <p className="text-sm font-semibold text-zinc-100">
                          {formatNumber(item.estoque_mp)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-400">Consumo mensal MP</p>
                        <p className="text-sm font-semibold text-zinc-100">
                          {formatNumber(item.consumo_mensal_mp)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-400">Quant. produzível</p>
                        <p className="text-sm font-semibold text-zinc-100">
                          {formatNumber(item.quant_produzivel)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: manter tabela (inalterado) */}
              <div className="mt-3 hidden md:block overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">Código MP</th>
                      <th className="px-3 py-2">Descrição MP</th>
                      <th className="px-3 py-2">UM</th>
                      <th className="px-3 py-2">FC</th>
                      <th className="px-3 py-2">Estoque MP</th>
                      <th className="px-3 py-2">Consumo mensal MP</th>
                      <th className="px-3 py-2">Quant produzível</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {fichaForSelected.map((item) => (
                      <tr key={item.cod_mp}>
                        <td className="px-3 py-2 font-semibold text-zinc-200">{item.cod_mp}</td>
                        <td className="px-3 py-2">{item.desc_mp}</td>
                        <td className="px-3 py-2">{item.um}</td>
                        <td className="px-3 py-2">{formatFC(item.fc)}</td>
                        <td className="px-3 py-2">{formatNumber(item.estoque_mp)}</td>
                        <td className="px-3 py-2">{formatNumber(item.consumo_mensal_mp)}</td>
                        <td className="px-3 py-2">{formatNumber(item.quant_produzivel)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">Capacidade produtiva</h3>
              {capacidade ? (
                <p className="mt-2 text-sm text-zinc-300">
                  Produção máxima estimada: <span className="font-semibold">{formatNumber(capacidade.quant_produzivel)}</span> unidades.
                  Gargalo: <span className="font-semibold">{capacidade.cod_mp}</span> ({capacidade.desc_mp}).
                </p>
              ) : (
                <p className="mt-2 text-sm text-zinc-400">Nenhum MP encontrado para este PA.</p>
              )}
            </section>
          </div>
        )}
      </Drawer>
    </main>
  );
}
