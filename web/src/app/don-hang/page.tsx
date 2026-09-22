import Artboard from "@/components/Artboard";
import html from "@/generated/DonHang";

export const metadata = { title: "Quản lý đơn hàng" };

export default function Page() {
  return <Artboard html={html} width={1440} />;
}
