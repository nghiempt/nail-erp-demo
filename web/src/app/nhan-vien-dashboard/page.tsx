import Artboard from "@/components/Artboard";
import html from "@/generated/NhanVienDashboard";

export const metadata = { title: "Ca của tôi — Nhân viên" };

export default function Page() {
  return <Artboard html={html} width={1440} />;
}
