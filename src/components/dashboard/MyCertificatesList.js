export default function MyCertificatesList({ certificates, courseMap }) {
  if (!certificates || certificates.length === 0) {
    return <p className="dash-empty">ما عندك شهادات صادرة بعد.</p>;
  }

  return (
    <div className="dashboard-card">
      {certificates.map((cert) => {
        const title = courseMap?.[cert.course_id] || "دورة";
        return (
          <div className="cert-item" key={cert.id}>
            <span>{title}</span>
            {cert.certificate_url ? (
              <a
                href={cert.certificate_url}
                target="_blank"
                rel="noopener"
                className="btn btn-outline"
              >
                تحميل الشهادة
              </a>
            ) : (
              <span className="cert-pending">قيد الإصدار</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
