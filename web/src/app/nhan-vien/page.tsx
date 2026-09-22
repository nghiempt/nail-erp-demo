import Artboard from "@/components/Artboard";
import html from "@/generated/NhanVien";

export const metadata = { title: "Nhân viên và chấm công" };

export default function Page() {
  return <Artboard html={html} width={1440} />;
}
