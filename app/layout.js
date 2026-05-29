import "./globals.css";
export const metadata = {
  title: "1000 English Collocations — Master",
  description: "Learn English collocations from the book with Uzbek translations",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
