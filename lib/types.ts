export type EstoqueData = {
  updatedAt: string;
  pa: PAItem[];
  mp: MPItem[];
  fichaTecnica: FichaTecnicaItem[];
};

export type PAItem = {
  rank: number;
  cod_pa: string;
  desc_pa: string;
  um: string;
  fc: number;
  estoque_pa: number;
  saida_mensal_pa: number;
  consumo_mensal_mp: number;
  familia: string;
  gm2: string;
};

export type MPItem = {
  cod_mp: string;
  desc_mp: string;
  um: string;
  estoque_mp: number;
  consumo_mensal_mp: number;
  familia: string;
  gm2: string;
};

export type FichaTecnicaItem = {
  cod_pa: string;
  cod_mp: string;
  desc_mp: string;
  um: string;
  fc: number;
};

export type StatusLabel = "Crítico" | "Atenção" | "Regular" | "Excesso" | "Sem consumo";

export type PAComputed = PAItem & {
  dias: number | null;
  status: StatusLabel;
};

export type MPComputed = MPItem & {
  dias: number | null;
  status: StatusLabel;
  estoqueIdeal: number;
};
