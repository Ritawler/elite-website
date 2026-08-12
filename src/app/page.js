import Header from "@/components/Header";
import {
  homeSectionsPreCourses,
  homeSectionsPostCourses,
  homeSectionsBottom,
} from "@/content/homeSections";
import CoursesSection from "@/components/CoursesSection";
import TopicsSection from "@/components/TopicsSection";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const [{ data: courses }, { data: topics }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, description, price, discount_price")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("member_topics")
      .select("id, title, author_name, published_at, pdf_url")
      .order("published_at", { ascending: false }),
  ]);

  return (
    <>
      <Header />
      <div dangerouslySetInnerHTML={{ __html: homeSectionsPreCourses }} />
      <CoursesSection courses={courses || []} />
      <div dangerouslySetInnerHTML={{ __html: homeSectionsPostCourses }} />
      <TopicsSection topics={topics || []} />
      <div dangerouslySetInnerHTML={{ __html: homeSectionsBottom }} />
    </>
  );
}
