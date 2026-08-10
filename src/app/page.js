import Header from "@/components/Header";
import { homeSectionsTop, homeSectionsBottom } from "@/content/homeSections";
import TopicsSection from "@/components/TopicsSection";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data: topics } = await supabase
    .from("member_topics")
    .select("id, title, author_name, published_at, pdf_url")
    .order("published_at", { ascending: false });

  return (
    <>
      <Header />
      <div dangerouslySetInnerHTML={{ __html: homeSectionsTop }} />
      <TopicsSection topics={topics || []} />
      <div dangerouslySetInnerHTML={{ __html: homeSectionsBottom }} />
    </>
  );
}
