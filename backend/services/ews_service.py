import os
import uuid
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List

import numpy as np

try:
    from firebase_admin import firestore
except Exception:  # pragma: no cover
    firestore = None


_MEM_ALERTS: Dict[str, List[Dict[str, Any]]] = {}


class EWSService:
    def __init__(self):
        self.cash_threshold_days = int(os.getenv("EWS_CASH_CRUNCH_DAYS_THRESHOLD", "30"))
        self.expense_growth_threshold = float(os.getenv("EWS_EXPENSE_GROWTH_THRESHOLD", "0.20"))

        self.db = None
        if firestore is not None:
            try:
                self.db = firestore.client()
            except Exception:
                self.db = None

    async def evaluate(self, uid: str, metrics: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        metrics = await self._resolve_metrics_payload(uid=uid, incoming=metrics or {})
        if not metrics:
            return []

        alerts: List[Dict[str, Any]] = []
        current = metrics.get("current") or {}
        history = metrics.get("history") or []

        burn = metrics.get("monthly_burn_rate") or self._calc_avg_burn(history)
        cash_balance = float(current.get("cash_balance") or 0)
        if burn > 0 and cash_balance >= 0:
            runway_days = (cash_balance / burn) * 30
            if runway_days < self.cash_threshold_days:
                severity = "critical" if runway_days < 14 else "high" if runway_days < 21 else "medium"
                alerts.append(
                    self._build_alert(
                        alert_type="cash_crunch",
                        severity=severity,
                        title=f"Cash Runway: ~{int(runway_days)} days",
                        detail=(
                            f"At current burn rate of {burn:,.0f}/month, cash reserves "
                            f"will last approximately {int(runway_days)} days."
                        ),
                        actions=[
                            "Review discretionary expenses immediately",
                            "Accelerate receivables collection",
                            "Pause non-essential capital spending",
                            "Prepare short-term liquidity backup",
                        ],
                        metrics={"runway_days": runway_days, "monthly_burn": burn},
                    )
                )

        if len(history) >= 2:
            prev_exp = float((history[-2] or {}).get("expenses") or 0)
            curr_exp = float(current.get("expenses") or 0)
            if prev_exp > 0:
                growth = (curr_exp - prev_exp) / prev_exp
                if growth > self.expense_growth_threshold:
                    severity = "critical" if growth > 0.40 else "high" if growth > 0.30 else "medium"
                    alerts.append(
                        self._build_alert(
                            alert_type="expense_spike",
                            severity=severity,
                            title=f"Expenses up {growth * 100:.1f}% MoM",
                            detail=(
                                f"Expenses increased from {prev_exp:,.0f} to {curr_exp:,.0f}, "
                                f"a {growth * 100:.1f}% rise."
                            ),
                            actions=[
                                "Break down top cost categories",
                                "Check duplicate or abnormal vendor payments",
                                "Freeze non-critical discretionary spending",
                                "Renegotiate high-impact recurring costs",
                            ],
                            metrics={"growth_pct": growth, "previous": prev_exp, "current": curr_exp},
                        )
                    )

        if len(history) >= 3:
            rev_series = [float((month or {}).get("revenue") or 0) for month in history[-3:]]
            rev_series.append(float(current.get("revenue") or 0))
            if all(rev_series[i] >= rev_series[i + 1] for i in range(len(rev_series) - 1)):
                alerts.append(
                    self._build_alert(
                        alert_type="revenue_decline",
                        severity="high",
                        title="Revenue declining for 3+ consecutive periods",
                        detail="Revenue has dropped consistently across recent periods.",
                        actions=[
                            "Identify the highest-drop customer segments",
                            "Audit conversion funnel and lost opportunities",
                            "Launch targeted win-back and demand campaigns",
                            "Revisit pricing and discount strategy",
                        ],
                        metrics={"revenue_series": rev_series},
                    )
                )

        if len(history) >= 2:
            prev = history[-1] or {}
            inv_change = float(current.get("inventory_value") or 0) - float(prev.get("inventory_value") or 0)
            rev_change = float(current.get("revenue") or 0) - float(prev.get("revenue") or 0)
            if inv_change > 0 and rev_change < 0:
                alerts.append(
                    self._build_alert(
                        alert_type="inventory_accumulation",
                        severity="medium",
                        title="Inventory rising while revenue declines",
                        detail=(
                            f"Inventory rose by {inv_change:,.0f} while revenue dropped "
                            f"by {abs(rev_change):,.0f}."
                        ),
                        actions=[
                            "Reduce replenishment for slow-moving SKUs",
                            "Run inventory liquidation promotions",
                            "Adjust demand forecasts and reorder thresholds",
                            "Review dead-stock and expiry risk",
                        ],
                        metrics={"inventory_change": inv_change, "revenue_change": rev_change},
                    )
                )

        if len(history) >= 2:
            prev_customers = float((history[-1] or {}).get("customer_count") or 0)
            curr_customers = float(current.get("customer_count") or 0)
            if prev_customers > 0:
                churn_rate = (prev_customers - curr_customers) / max(prev_customers, 1)
                if churn_rate > 0.05:
                    severity = "critical" if churn_rate > 0.15 else "high" if churn_rate > 0.10 else "medium"
                    alerts.append(
                        self._build_alert(
                            alert_type="churn_spike",
                            severity=severity,
                            title=f"Customer churn at {churn_rate * 100:.1f}%",
                            detail=(
                                f"Lost {int(prev_customers - curr_customers)} customers in the latest period "
                                f"({churn_rate * 100:.1f}% churn)."
                            ),
                            actions=[
                                "Contact recent churned customers for root-cause feedback",
                                "Flag at-risk accounts for immediate outreach",
                                "Review service quality, SLA, and price positioning",
                                "Deploy retention offers for high-value segments",
                            ],
                            metrics={"churn_rate": churn_rate},
                        )
                    )

        await self._save_alerts(uid, alerts)
        return alerts

    async def _resolve_metrics_payload(
        self,
        uid: str,
        incoming: Dict[str, Any],
    ) -> Dict[str, Any]:
        normalized_incoming = self._normalize_metrics_payload(incoming)

        # If caller already passed usable historical metrics, keep backward compatibility.
        if normalized_incoming.get("history") and normalized_incoming.get("current"):
            return normalized_incoming

        firestore_payload = await self._load_firestore_metrics(uid)
        if not firestore_payload:
            return normalized_incoming

        # Merge incoming current values (if any) on top of Firestore current snapshot.
        current = dict(firestore_payload.get("current") or {})
        current.update(normalized_incoming.get("current") or {})

        resolved = {
            "history": firestore_payload.get("history") or [],
            "current": current,
            "monthly_burn_rate": normalized_incoming.get("monthly_burn_rate")
            or firestore_payload.get("monthly_burn_rate"),
            "accounts_receivable": normalized_incoming.get("accounts_receivable")
            or firestore_payload.get("accounts_receivable"),
            "accounts_payable": normalized_incoming.get("accounts_payable")
            or firestore_payload.get("accounts_payable"),
        }
        return self._normalize_metrics_payload(resolved)

    async def _load_firestore_metrics(self, uid: str) -> Dict[str, Any]:
        if self.db is None:
            return {}

        snapshots = self._load_monthly_snapshots_collection(uid)
        if len(snapshots) < 2:
            snapshots = self._aggregate_monthly_from_daily_logs(uid)

        if len(snapshots) < 2:
            return {}

        ordered = sorted(snapshots, key=lambda item: item.get("month", ""))
        history = ordered[:-1]
        current = ordered[-1]
        burn = self._calc_avg_burn(ordered)

        return {
            "history": history,
            "current": current,
            "monthly_burn_rate": burn if burn > 0 else None,
        }

    def _load_monthly_snapshots_collection(self, uid: str) -> List[Dict[str, Any]]:
        snapshots: List[Dict[str, Any]] = []
        try:
            docs = (
                self.db.collection("users")
                .document(uid)
                .collection("metrics")
                .order_by("month", direction=firestore.Query.DESCENDING)
                .limit(12)
                .stream()
            )
            for doc in docs:
                normalized = self._normalize_snapshot(doc.to_dict() or {})
                if normalized:
                    snapshots.append(normalized)
        except Exception:
            return []
        return snapshots

    def _aggregate_monthly_from_daily_logs(self, uid: str) -> List[Dict[str, Any]]:
        try:
            docs = (
                self.db.collection("users")
                .document(uid)
                .collection("dailyLogs")
                .order_by("date", direction=firestore.Query.DESCENDING)
                .limit(365)
                .stream()
            )
        except Exception:
            return []

        buckets: Dict[str, Dict[str, Any]] = defaultdict(
            lambda: {
                "month": "",
                "revenue": 0.0,
                "expenses": 0.0,
                "cash_balance": 0.0,
                "inventory_value": 0.0,
                "customer_count": 0.0,
                "cogs": 0.0,
                "_rows": 0,
                "_cash_seen": False,
                "_inventory_seen": False,
            }
        )

        for doc in docs:
            payload = doc.to_dict() or {}
            month_key = self._month_from_payload(payload)
            if not month_key:
                continue

            row = buckets[month_key]
            row["month"] = month_key
            row["_rows"] += 1

            revenue = self._num(payload.get("revenue"))
            expenses = self._num(payload.get("expenses"))
            customers = self._num(payload.get("customers") or payload.get("customer_count"))
            inventory = self._num(payload.get("inventory_value") or payload.get("inventory_count"))
            cogs = self._num(payload.get("cogs") or payload.get("food_cost"))
            cash = self._num(
                payload.get("cash_balance")
                or payload.get("cash")
                or payload.get("bank_balance")
            )

            row["revenue"] += revenue
            row["expenses"] += expenses
            row["customer_count"] += customers
            row["cogs"] += cogs

            if inventory > 0:
                row["inventory_value"] += inventory
                row["_inventory_seen"] = True

            if cash > 0:
                row["cash_balance"] = cash
                row["_cash_seen"] = True

        if not buckets:
            return []

        aggregated: List[Dict[str, Any]] = []
        for month in sorted(buckets.keys()):
            row = buckets[month]
            rows = max(int(row.get("_rows") or 1), 1)

            if row.get("_inventory_seen"):
                inventory_value = row["inventory_value"] / rows
            else:
                inventory_value = 0.0

            customer_count = int(round(row["customer_count"] / rows))
            cash_balance = row["cash_balance"] if row.get("_cash_seen") else 0.0

            aggregated.append(
                {
                    "month": month,
                    "revenue": round(row["revenue"], 2),
                    "expenses": round(row["expenses"], 2),
                    "cash_balance": round(cash_balance, 2),
                    "inventory_value": round(inventory_value, 2),
                    "customer_count": max(customer_count, 0),
                    "cogs": round(row["cogs"], 2),
                }
            )

        return aggregated[-12:]

    @staticmethod
    def _month_from_payload(payload: Dict[str, Any]) -> str:
        raw = payload.get("month") or payload.get("date")
        if not raw:
            return ""
        text = str(raw)
        if len(text) >= 7:
            return text[:7]
        return ""

    def _normalize_metrics_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        history = [self._normalize_snapshot(item or {}) for item in payload.get("history") or []]
        history = [item for item in history if item]
        current = self._normalize_snapshot(payload.get("current") or {})

        if history and current:
            history = sorted(history, key=lambda item: item.get("month", ""))

        normalized: Dict[str, Any] = {
            "history": history,
            "current": current,
            "monthly_burn_rate": self._num(payload.get("monthly_burn_rate")),
            "accounts_receivable": self._num(payload.get("accounts_receivable")),
            "accounts_payable": self._num(payload.get("accounts_payable")),
        }
        return normalized

    def _normalize_snapshot(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        month = self._month_from_payload(payload)
        if not month:
            return {}

        return {
            "month": month,
            "revenue": self._num(payload.get("revenue")),
            "expenses": self._num(payload.get("expenses")),
            "cash_balance": self._num(
                payload.get("cash_balance") or payload.get("cash") or payload.get("bank_balance")
            ),
            "inventory_value": self._num(payload.get("inventory_value") or payload.get("inventory_count")),
            "customer_count": int(round(self._num(payload.get("customer_count") or payload.get("customers")))),
            "cogs": self._num(payload.get("cogs") or payload.get("food_cost")),
        }

    @staticmethod
    def _num(value: Any) -> float:
        try:
            number = float(value)
            if np.isfinite(number):
                return number
        except Exception:
            pass
        return 0.0

    @staticmethod
    def _calc_avg_burn(history: List[Dict[str, Any]]) -> float:
        if not history:
            return 0.0
        burns = [float((month or {}).get("expenses") or 0) for month in history[-3:]]
        burns = [value for value in burns if value > 0]
        if not burns:
            return 0.0
        return float(np.mean(burns))

    @staticmethod
    def _build_alert(
        alert_type: str,
        severity: str,
        title: str,
        detail: str,
        actions: List[str],
        metrics: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        return {
            "id": str(uuid.uuid4()),
            "type": alert_type,
            "severity": severity,
            "title": title,
            "detail": detail,
            "suggested_actions": actions,
            "metrics": metrics or {},
            "created_at": datetime.utcnow().isoformat(),
            "dismissed": False,
        }

    async def _save_alerts(self, uid: str, alerts: List[Dict[str, Any]]) -> None:
        if self.db is None:
            current = [item for item in _MEM_ALERTS.get(uid, []) if not item.get("dismissed")]
            _MEM_ALERTS[uid] = alerts + current
            return

        batch = self.db.batch()
        col = self.db.collection("users").document(uid).collection("alerts")
        for alert in alerts:
            batch.set(col.document(alert["id"]), alert)
        batch.commit()

    async def get_active_alerts(self, uid: str) -> List[Dict[str, Any]]:
        if self.db is None:
            active = [item for item in _MEM_ALERTS.get(uid, []) if not item.get("dismissed")]
            return sorted(active, key=lambda item: item.get("created_at", ""), reverse=True)[:50]

        docs = (
            self.db.collection("users")
            .document(uid)
            .collection("alerts")
            .where("dismissed", "==", False)
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(50)
            .stream()
        )
        return [doc.to_dict() for doc in docs]

    async def dismiss_alert(self, uid: str, alert_id: str) -> None:
        if self.db is None:
            bucket = _MEM_ALERTS.get(uid, [])
            for item in bucket:
                if item.get("id") == alert_id:
                    item["dismissed"] = True
            return

        (
            self.db.collection("users")
            .document(uid)
            .collection("alerts")
            .document(alert_id)
            .update({"dismissed": True})
        )
