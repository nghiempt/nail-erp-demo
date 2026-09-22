import Artboard from "@/components/Artboard";
import html from "@/generated/ZaloOA";

export const metadata = { title: "Tin nhắn Zalo OA" };

export default function Page() {
  return (
    <Artboard
      html={html}
      width={1440}
      name="ZaloOA"
    />
  );
}
