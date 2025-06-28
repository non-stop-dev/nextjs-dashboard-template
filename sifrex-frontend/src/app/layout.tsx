// app/layout.tsx
import { Inter } from 'next/font/google';
import "./globals.css";

// Configure font
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "Sifrex",
  description: "Sifrex Research",
};

// Root layout should only handle the HTML shell and global setup
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('RENDER: app/layout.tsx (Root Layout)'); // <--- LOG AÑADIDO
  return (
    <html suppressHydrationWarning>
      <head>
        {/* Global meta tags, favicons, etc. */}
      </head>
      <body className={inter.className}>
        {/* Children will be the locale layout which handles everything else */}
        {children}
      </body>
    </html>
  );
}