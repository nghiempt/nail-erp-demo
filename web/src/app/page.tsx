import Artboard from "@/components/Artboard";
import html from "@/generated/Landing";

export const metadata = { title: "Landing — Nail Studio Hạ Vy" };

export default function Page() {
  return (
    <Artboard
      html={html}
      width={1440}
      name="Landing"
    />
  );
}
