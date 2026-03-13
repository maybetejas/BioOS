import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TeeshaProvider } from "@/context/TeeshaContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Accountability Tracker",
  description: "A reusable accountability tracker for daily execution and reflection.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TeeshaProvider>
          {children}
        </TeeshaProvider>
      </body>
    </html>
  );
}
