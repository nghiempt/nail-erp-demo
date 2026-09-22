import Artboard from "@/components/Artboard";
import html from "@/generated/KhachHang";

export const metadata = { title: "Danh sách khách hàng" };

export default function Page() {
  return <Artboard html={html} width={1440} />;
}
