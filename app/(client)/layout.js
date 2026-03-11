import "../globals.css";
import Footer from "./_components/layout/Footer";
import Header from "./_components/layout/Header";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css" />
      </head>
      <body className="font-inter bg-white text-dark">
        <Header />

        {children}

        <Footer />
      </body>
    </html>
  );
}
