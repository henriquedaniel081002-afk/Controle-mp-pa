import type { MPItem, PAItem, StatusLabel } from "./types";

const roundDays = (value: number) => Math.round(value);

export const computePaDaysAndStatus = (item: PAItem) => {
  if (item.saida_mensal_pa === 0) {
    return { dias: null, status: "Sem consumo" as StatusLabel };
  }

  const dias = (item.estoque_pa / item.saida_mensal_pa) * 30;
  const rounded = roundDays(dias);

  let status: StatusLabel = "Regular";
  if (rounded < 15) {
    status = "Crítico";
  } else if (rounded < 90) {
    status = "Atenção";
  } else if (rounded <= 120) {
    status = "Regular";
  } else {
    status = "Excesso";
  }

  return { dias: rounded, status };
};

export const computeMpDaysAndStatus = (item: MPItem) => {
  if (item.consumo_mensal_mp === 0) {
    return { dias: null, status: "Sem consumo" as StatusLabel };
  }

  const dias = (item.estoque_mp / item.consumo_mensal_mp) * 30;
  const rounded = roundDays(dias);

  let status: StatusLabel = "Regular";
  if (rounded < 60) {
    status = "Crítico";
  } else if (rounded <= 120) {
    status = "Regular";
  } else {
    status = "Excesso";
  }

  return { dias: rounded, status };
};

export const computeEstoqueIdeal = (item: MPItem) => item.consumo_mensal_mp * 4;
