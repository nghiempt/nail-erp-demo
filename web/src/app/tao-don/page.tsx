import Artboard from "@/components/Artboard";
import html from "@/generated/TaoDon";

export const metadata = { title: "Tạo đơn hàng tại quầy" };

export default function Page() {
  return (
    <Artboard
      html={html}
      width={1440}
      name="TaoDon"
    />
  );
}
