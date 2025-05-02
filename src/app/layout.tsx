import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Use Inter font
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' }); // Configure Inter font

export const metadata: Metadata = {
  title: 'Idea Spark', // Update App Name
  description: 'Generate and manage your creative project ideas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Removed whitespace between <html> and <body> */}
      <body className={`${inter.variable} font-sans antialiased`}> {/* Use Inter font variable */}
        {children}
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
