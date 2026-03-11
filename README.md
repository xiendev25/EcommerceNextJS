# EcommerceNextJS 🛒

> Một ứng dụng E-commerce hiện đại được xây dựng trên nền tảng Next.js 15, giao diện tùy chỉnh với Tailwind CSS v4 và hệ sinh thái React đa dạng.

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 🌟 Giới thiệu tổng quan

Dự án EcommerceNextJS là một giải pháp thương mại điện tử linh hoạt, mang lại trải nghiệm mua sắm mượt mà cho người dùng và công cụ quản trị nội dung mạnh mẽ cho quản trị viên. Hệ thống sử dụng Turbopack để tối ưu hóa tốc độ phát triển và tích hợp sẵn các công cụ xử lý UI/UX chuyên nghiệp.

## 🚀 Các tính năng nổi bật (Dựa trên Tech Stack)

- ⚡ **Hiệu suất cực cao:** Sử dụng **Next.js 15** kết hợp với **Turbopack** (`next dev --turbopack`) giúp tăng tốc độ build và hot-reload trong quá trình phát triển.
- 🎨 **Giao diện hiện đại & Responsive:** Xây dựng toàn bộ hệ thống UI bằng **Tailwind CSS v4**, đảm bảo hiển thị đẹp mắt trên mọi kích thước màn hình.
- 🖼️ **Trình diễn sản phẩm mượt mà:** Sử dụng **Swiper** để tạo các carousel/slider trình chiếu hình ảnh sản phẩm và banner chuyên nghiệp.
- 📝 **Soạn thảo nội dung phong phú:** Tích hợp **TinyMCE** (`@tinymce/tinymce-react`) cho các trang quản trị (Admin), cho phép viết bài blog hoặc mô tả sản phẩm với đầy đủ định dạng (Rich Text).
- 🎚️ **Bộ lọc thông minh:** Ứng dụng **React Slider** để xây dựng các thanh kéo chọn khoảng giá (Price Range Slider) trực quan.
- 📁 **Xử lý dữ liệu & File Upload:** Sử dụng **Formidable** ở phía API routes để bắt và xử lý các form data chứa file (upload hình ảnh sản phẩm, avatar,...).
- 🧩 **Hệ thống Icon đa dạng:** Kết hợp linh hoạt giữa **Lucide React** và **FontAwesome** (`@fortawesome/react-fontawesome`) cho hệ thống biểu tượng sắc nét.

## 🛠️ Công nghệ sử dụng

**Core Framework:**

- Next.js 15.5.2
- React 18.3.1
- Node.js (với TypeScript types)

**Styling & UI Components:**

- Tailwind CSS ^4.0
- Swiper ^11.2
- React Slider ^2.0
- Lucide React & FontAwesome

**Utilities & Tools:**

- Formidable (Parse Form/File uploads)
- TinyMCE ^8.1 (Rich Text Editor)
- ESLint (Code linting)

## 💻 Hướng dẫn cài đặt & Khởi chạy

Làm theo các bước sau để cài đặt và chạy dự án ở môi trường phát triển (Development):

### 1. Clone dự án về máy

```bash
git clone [https://github.com/xiendev25/EcommerceNextJS.git](https://github.com/xiendev25/EcommerceNextJS.git)
cd EcommerceNextJS
```

### 2. Cài đặt thư viện (Dependencies)

Do dự án sử dụng các phiên bản mới, hãy chắc chắn bạn đang dùng Node.js bản tương đối gần đây (v18+).

```bash
npm install
# hoặc
yarn install
```

### 3. Chạy môi trường phát triển (Mặc định dùng Turbopack)

```bash
npm run dev
# hoặc
yarn dev
```

Dự án sẽ khởi chạy tại: [http://localhost:3000](http://localhost:3000). Nhờ có Turbopack, tốc độ khởi động sẽ cực kỳ nhanh.

### 4. Build cho Production

```bash
npm run build
npm run start
```

## 🤝 Đóng góp (Contributing)

Mọi ý kiến đóng góp hoặc báo lỗi đều được hoan nghênh. Vui lòng mở [Issues](https://github.com/xiendev25/EcommerceNextJS/issues) hoặc tạo Pull Request mới.

## 👤 Tác giả

**xiendev25**

- GitHub: [@xiendev25](https://github.com/xiendev25)
