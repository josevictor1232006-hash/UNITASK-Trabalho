"""Cálculo de média e nota necessária (MVP).

Regras (docs/database.md + D03):
- Escala 0–10; passing_grade por matéria.
- Com pesos em todas as avaliações: média ponderada.
- Sem pesos (ou pesos incompletos): média aritmética simples das notas lançadas.
- Nota necessária só quando há avaliações pendentes e a regra é matematicamente
  aplicável; não inventa pesos/quantidade.
"""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable

MAX_SCORE = Decimal("10.00")
ZERO = Decimal("0.00")
TWOPLACES = Decimal("0.01")


def _q(value: Decimal) -> Decimal:
    return value.quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def _as_decimal(value) -> Decimal:
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def compute_subject_grades(
    *,
    passing_grade,
    assessments: Iterable,
) -> dict:
    """Recebe objetos/dicts com score e weight (podem ser None).

    Retorna dict serializável com current_average, method, needed_on_remaining, etc.
    """
    items = list(assessments)
    passing = _as_decimal(passing_grade)

    scored = [a for a in items if getattr(a, "score", None) is not None]
    pending = [a for a in items if getattr(a, "score", None) is None]

    scored_count = len(scored)
    pending_count = len(pending)
    total_count = len(items)

    result = {
        "passing_grade": str(_q(passing)),
        "max_score": str(MAX_SCORE),
        "scored_count": scored_count,
        "pending_count": pending_count,
        "total_count": total_count,
        "current_average": None,
        "method": None,
        "needed_on_remaining": None,
        "needed_feasible": None,
        "already_passing": None,
        "message": None,
    }

    if scored_count == 0:
        result["message"] = "Nenhuma nota lançada ainda."
        return result

    scored_weights = [getattr(a, "weight", None) for a in scored]
    all_scored_weighted = all(w is not None and _as_decimal(w) > ZERO for w in scored_weights)

    if all_scored_weighted:
        method = "weighted"
        weight_sum = sum((_as_decimal(a.weight) for a in scored), ZERO)
        weighted_sum = sum(
            (_as_decimal(a.score) * _as_decimal(a.weight) for a in scored),
            ZERO,
        )
        current = weighted_sum / weight_sum
    else:
        method = "simple"
        score_sum = sum((_as_decimal(a.score) for a in scored), ZERO)
        current = score_sum / Decimal(scored_count)

    current = _q(current)
    result["current_average"] = str(current)
    result["method"] = method
    result["already_passing"] = current >= passing

    if pending_count == 0:
        if current >= passing:
            result["message"] = "Todas as notas lançadas. Média atingiu a aprovação."
        else:
            result["message"] = "Todas as notas lançadas. Média abaixo da aprovação."
        return result

    # Nota necessária nas avaliações pendentes
    all_items_weighted = all(
        getattr(a, "weight", None) is not None and _as_decimal(a.weight) > ZERO for a in items
    )

    if method == "weighted" and all_items_weighted:
        total_weight = sum((_as_decimal(a.weight) for a in items), ZERO)
        scored_weighted = sum(
            (_as_decimal(a.score) * _as_decimal(a.weight) for a in scored),
            ZERO,
        )
        remaining_weight = sum((_as_decimal(a.weight) for a in pending), ZERO)
        if remaining_weight <= ZERO:
            result["message"] = "Não foi possível calcular a nota necessária."
            return result
        needed = (passing * total_weight - scored_weighted) / remaining_weight
    elif method == "simple" and all(getattr(a, "weight", None) is None for a in items):
        # Média simples assumindo peso igual entre todas as avaliações cadastradas
        score_sum = sum((_as_decimal(a.score) for a in scored), ZERO)
        needed = (passing * Decimal(total_count) - score_sum) / Decimal(pending_count)
    else:
        result["message"] = (
            "Nota necessária indisponível: use pesos em todas as avaliações "
            "ou deixe todas sem peso."
        )
        return result

    needed = _q(needed)
    if needed <= ZERO:
        result["needed_on_remaining"] = str(ZERO)
        result["needed_feasible"] = True
        result["message"] = "Já é possível aprovar mesmo zerando o restante."
        return result

    result["needed_on_remaining"] = str(needed)
    result["needed_feasible"] = needed <= MAX_SCORE
    if needed > MAX_SCORE:
        result["message"] = (
            f"Seria necessário tirar {needed} no restante (acima do máximo {MAX_SCORE})."
        )
    else:
        result["message"] = (
            f"É necessário média {needed} nas avaliações pendentes para atingir { _q(passing) }."
        )
    return result
