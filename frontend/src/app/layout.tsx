import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Chat and Order App",
  description: "A simple chat and order management application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} bg-black text-white h-full`}>
        <div className="flex h-full">{children}</div>
      </body>
    </html>
  );
}
