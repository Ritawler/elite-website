import Header from "@/components/Header";
import { homeSections } from "@/content/homeSections";

export default function Home() {
  return (
    <>
      <Header />
      <div dangerouslySetInnerHTML={{ __html: homeSections }} />
    </>
  );
}
