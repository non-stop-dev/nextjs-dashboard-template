// app/[locale]/auth/layout.tsx

// Este layout envolverá tus páginas de autenticación (signin, signup, etc.).
// Asegúrate de que sea lo más mínimo posible para no mostrar la UI de la aplicación.
export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    console.log('RENDER: app/[locale]/auth/layout.tsx (Auth Layout)'); // <--- LOG AÑADIDO
    return (
      // No incluyas Sidebar, Navbar, Footer aquí.
      // Solo renderiza los children, que serán tus páginas de autenticación.
      // Esto asegura que solo se vea el formulario de login/registro.
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {children}
      </div>
    );
  }