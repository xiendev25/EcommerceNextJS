import NavBar from "../../_components/navbar/NavBar";
import SlideBar from "../../_components/slidebar/SlideBar";
import "../../../globals.css"

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css" />
      </head>
      <body className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
        <div id="app" className="flex h-screen">
          <SlideBar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <NavBar />

            <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
              {children}
            </main>
          </div>
        </div>
      </body>

    </html>
  );
}
