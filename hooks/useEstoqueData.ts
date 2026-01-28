"use client";

import { useEffect, useState } from "react";
import type { EstoqueData, FichaTecnicaItem, MPItem, PAItem } from "@/lib/types";

const normalizeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizePA = (item: PAItem): PAItem => ({
  ...item,
  rank: normalizeNumber(item.rank),
  fc: normalizeNumber(item.fc),
  estoque_pa: normalizeNumber(item.estoque_pa),
  saida_mensal_pa: normalizeNumber(item.saida_mensal_pa),
  consumo_mensal_mp: normalizeNumber(item.consumo_mensal_mp)
});

const normalizeMP = (item: MPItem): MPItem => ({
  ...item,
  estoque_mp: normalizeNumber(item.estoque_mp),
  consumo_mensal_mp: normalizeNumber(item.consumo_mensal_mp)
});

const normalizeFicha = (item: FichaTecnicaItem): FichaTecnicaItem => ({
  ...item,
  fc: normalizeNumber(item.fc)
});

export const useEstoqueData = () => {
  const [data, setData] = useState<EstoqueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response = await fetch("/data/estoque.json");
        if (!response.ok) {
          throw new Error("Falha ao carregar dados");
        }
        const payload = (await response.json()) as EstoqueData;
        if (!isMounted) return;
        setData({
          updatedAt: payload.updatedAt,
          pa: payload.pa.map(normalizePA),
          mp: payload.mp.map(normalizeMP),
          fichaTecnica: payload.fichaTecnica.map(normalizeFicha)
        });
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading, error };
};
