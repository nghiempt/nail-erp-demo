import Artboard from "@/components/Artboard";
import html from "@/generated/Login";

export const metadata = { title: "Đăng nhập — NailSpace" };

export default function Page() {
  return (
    <Artboard
      html={html}
      width={1440}
      name="Login"
    />
  );
}
