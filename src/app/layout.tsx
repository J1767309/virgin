import type { Metadata } from "next"
import { Toaster } from 'react-hot-toast'
import "./globals.css"

export const metadata: Metadata = {
  title: "Virgin Hotels Performance Portal",
  description: "Revenue Management and Commercial Strategy Platform for Virgin Hotels Collection",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
