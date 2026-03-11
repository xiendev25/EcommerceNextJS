import HotProduct from "./_components/home/HotProduct";
import Category from "./_components/home/Category";
import Hero from "./_components/home/Hero";
import NewProduct from "./_components/home/NewProduct";
import SaleProduct from "./_components/home/SaleProduct";
import ProductByCategory from "./_components/home/ProductByCategory";
import NewPost from "./_components/home/NewPost";

import Link from "next/link";

export default function Home() {

  return (
    <main className="pt-40">
      <Hero />
      <Category />
      <HotProduct />
      <NewProduct />
      <SaleProduct />
      <ProductByCategory />
      <NewPost />
    </main>
  );
}
