import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import SmoothScroll from "../components/SmoothScroll";
import ClientLayout from "../components/ClientLayout";
import { createClient } from "@/utils/supabase/server";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Tavern - Collaborative Learning & Version Control",
  description: "A premium platform for sharing notes, tracking study time, and version controlling your handwritten ideas with InkFlow.",
};

export default async function RootLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className="bg-premium-black">
      <body className={`${inter.variable} font-sans antialiased text-white selection:bg-accent-blue selection:text-navy-blue`}>
        <SmoothScroll>
          <Navigation user={user} />
          <ClientLayout user={user}>
            {children}
          </ClientLayout>
          {!user && <Footer />}
        </SmoothScroll>
      </body>
    </html>
  );
}
