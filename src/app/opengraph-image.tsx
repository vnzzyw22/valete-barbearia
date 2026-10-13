import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Valete Barbearia — Cut and Beard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Prévia de compartilhamento: logo original (alfa pela luminância, public/brand) sobre carvão.
// Cores literais porque o Satori não lê o CSS do site; valores de globals.css.
export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/brand/valete-logo-alpha.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#121212",
        }}
      >
        <img src={src} width={560} height={560} alt="" />
      </div>
    ),
    size,
  );
}
