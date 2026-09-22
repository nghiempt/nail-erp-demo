import Artboard from "@/components/Artboard";
import html from "@/generated/DichVu";

export const metadata = { title: "Danh sách dịch vụ" };

export default function Page() {
  return (
    <Artboard
      html={html}
      width={1440}
      name="DichVu"
    />
  );
}
