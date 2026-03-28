import { Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";
import { TeeshaProvider } from "@/context/TeeshaContext";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Accountability Tracker",
  description: "A reusable accountability tracker for daily execution and reflection.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} ${rajdhani.variable} antialiased`}>
        <TeeshaProvider>
          {children}
        </TeeshaProvider>
      </body>
    </html>
  );
}
