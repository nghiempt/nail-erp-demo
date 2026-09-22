import Artboard from "@/components/Artboard";
import html from "@/generated/Gallery";

export const metadata = { title: "Gallery mẫu móng" };

export default function Page() {
  return <Artboard html={html} width={1440} />;
}
