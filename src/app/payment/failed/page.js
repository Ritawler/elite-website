import Header from "@/components/Header";

export default async function PaymentFailedPage({ searchParams }) {
  const params = await searchParams;
  // Temporary: log everything UPayments sends back so we can debug the sandbox flow
  console.error("[PaymentFailed] searchParams:", JSON.stringify(params));

  return (
    <>
      <Header />
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>لم تكتمل عملية الدفع</h1>
          <p className="auth-subtitle">
            تم إلغاء عملية الدفع أو لم تنجح. ما تم خصم أي مبلغ. تقدر تحاول مرة أخرى.
          </p>
          <a href="/courses" className="btn btn-primary auth-submit">
            الرجوع للدورات
          </a>
        </div>
      </div>
    </>
  );
}
