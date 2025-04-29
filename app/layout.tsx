import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Đổi tên file tự động",
  description: "Ứng dụng đổi tên file ảnh và file nhãn theo định dạng tùy chỉnh",
  authors: [{ name: "Hà Trọng Nguyễn" }],
  creator: "Hà Trọng Nguyễn",
  publisher: "Hà Trọng Nguyễn",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
