import React from "react";

// Componente que muestra una galería de botones con diferentes estilos de Tailwind
const ButtonGallery: React.FC = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center gap-8">
      {/* Título de la galería */}
      <h1 className="text-2xl font-bold text-gray-800">Galería de Botones con Tailwind</h1>

      {/* Cuadrícula para los botones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl">
        {/* Botón 1: Redondeado con sombra suave y borde sutil */}
        <div className="flex flex-col items-center gap-2">
          <button
            className="
              px-4 py-2 
              bg-blue-500 text-white 
              rounded-lg 
              border border-blue-300 
              shadow-md 
              hover:shadow-lg hover:bg-blue-600 
              active:scale-95 
              transition-all duration-200
            "
          >
            Botón 1
          </button>
          <span className="text-sm text-gray-600">Botón 1: Redondeado</span>
          {/* Comentario explicativo */}
          <p className="text-xs text-gray-500 text-center">
            {/* px-4 py-2: Padding horizontal y vertical */}
            {/* bg-blue-500: Fondo azul */}
            {/* text-white: Texto blanco */}
            {/* rounded-lg: Bordes redondeados */}
            {/* border border-blue-300: Borde azul claro */}
            {/* shadow-md: Sombra suave */}
            {/* hover:shadow-lg: Sombra más grande al hover */}
            {/* hover:bg-blue-600: Fondo más oscuro al hover */}
            {/* active:scale-95: Escala al 95% al clic */}
            {/* transition-all: Transición suave para todos los cambios */}
          </p>
        </div>

        {/* Botón 2: Redondeado con sombra pronunciada y borde colorido */}
        <div className="flex flex-col items-center gap-2">
          <button
            className="
              px-4 py-2 
              bg-green-600 text-white 
              rounded-full 
              border-2 border-green-400 
              shadow-xl 
              hover:shadow-2xl hover:bg-green-700 
              active:scale-90 
              transition-all duration-300
            "
          >
            Botón 2
          </button>
          <span className="text-sm text-gray-600">Botón 2: Redondeado</span>
          <p className="text-xs text-gray-500 text-center">
            {/* px-4 py-2: Padding horizontal y vertical */}
            {/* bg-green-600: Fondo verde oscuro */}
            {/* text-white: Texto blanco */}
            {/* rounded-full: Bordes completamente redondeados */}
            {/* border-2 border-green-400: Borde grueso verde claro */}
            {/* shadow-xl: Sombra pronunciada */}
            {/* hover:shadow-2xl: Sombra más grande al hover */}
            {/* hover:bg-green-700: Fondo más oscuro al hover */}
            {/* active:scale-90: Escala al 90% al clic */}
            {/* transition-all: Transición suave para todos los cambios */}
          </p>
        </div>

        {/* Botón Cuadrado 1: Cuadrado con sombra y borde */}
        <div className="flex flex-col items-center gap-2">
          <button
            className="
              w-12 h-12 
              bg-red-500 text-white 
              rounded-md 
              border border-red-300 
              shadow-md 
              hover:bg-red-600 hover:shadow-lg 
              active:scale-95 
              transition-all duration-200
            "
          >
            C1
          </button>
          <span className="text-sm text-gray-600">Botón Cuadrado 1</span>
          <p className="text-xs text-gray-500 text-center">
            {/* w-12 h-12: Tamaño fijo cuadrado (48x48px) */}
            {/* bg-red-500: Fondo rojo */}
            {/* text-white: Texto blanco */}
            {/* rounded-md: Bordes ligeramente redondeados */}
            {/* border border-red-300: Borde rojo claro */}
            {/* shadow-md: Sombra suave */}
            {/* hover:bg-red-600: Fondo más oscuro al hover */}
            {/* hover:shadow-lg: Sombra más grande al hover */}
            {/* active:scale-95: Escala al 95% al clic */}
            {/* transition-all: Transición suave */}
          </p>
        </div>

        {/* Botón Cuadrado 2: Cuadrado con sombra elevada y borde grueso */}
        <div className="flex flex-col items-center gap-2">
          <button
            className="
              w-12 h-12 
              bg-purple-600 text-white 
              rounded-none 
              border-2 border-purple-400 
              shadow-lg 
              hover:shadow-xl hover:bg-purple-700 
              active:scale-90 
              transition-all duration-200
            "
          >
            C2
          </button>
          <span className="text-sm text-gray-600">Botón Cuadrado 2</span>
          <p className="text-xs text-gray-500 text-center">
            {/* w-12 h-12: Tamaño fijo cuadrado */}
            {/* bg-purple-600: Fondo morado */}
            {/* text-white: Texto blanco */}
            {/* rounded-none: Sin bordes redondeados (completamente cuadrado) */}
            {/* border-2 border-purple-400: Borde grueso morado claro */}
            {/* shadow-lg: Sombra más elevada */}
            {/* hover:shadow-xl: Sombra más grande al hover */}
            {/* hover:bg-purple-700: Fondo más oscuro al hover */}
            {/* active:scale-90: Escala al 90% al clic */}
            {/* transition-all: Transición suave */}
          </p>
        </div>

        {/* Botón Cuadrado 3: Cuadrado con sombra coloreada y sin borde */}
        <div className="flex flex-col items-center gap-2">
          <button
            className="
              w-12 h-12 
              bg-yellow-500 text-white 
              rounded-md 
              shadow-[0_4px_14px_rgba(255,180,0,0.4)] 
              hover:shadow-[0_6px_20px_rgba(255,180,0,0.6)] hover:bg-yellow-600 
              active:scale-95 
              transition-all duration-200
            "
          >
            C3
          </button>
          <span className="text-sm text-gray-600">Botón Cuadrado 3</span>
          <p className="text-xs text-gray-500 text-center">
            {/* w-12 h-12: Tamaño fijo cuadrado */}
            {/* bg-yellow-500: Fondo amarillo */}
            {/* text-white: Texto blanco */}
            {/* rounded-md: Bordes ligeramente redondeados */}
            {/* shadow-[0_4px_14px_rgba(255,180,0,0.4)]: Sombra personalizada amarilla */}
            {/* hover:shadow-[0_6px_20px_rgba(255,180,0,0.6)]: Sombra más grande y brillante al hover */}
            {/* hover:bg-yellow-600: Fondo más oscuro al hover */}
            {/* active:scale-95: Escala al 95% al clic */}
            {/* transition-all: Transición suave */}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ButtonGallery;