const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function formatPeriod(periodMonth) {
  const [year, month] = periodMonth.split("-");
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

export default function StaffEvaluationsList({ evaluations }) {
  if (evaluations.length === 0) {
    return <p className="dash-empty">ما فيه تقييمات مضافة لك بعد.</p>;
  }

  return (
    <div className="dashboard-card">
      {evaluations.map((ev) => (
        <div className="cert-item" key={ev.id} style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <strong>{formatPeriod(ev.period_month)}</strong> — {ev.rating} / 5
            {ev.comment && <p style={{ margin: "6px 0 0" }}>{ev.comment}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
