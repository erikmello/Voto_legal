/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'urna-bg': '#e0e0e0',
                'urna-display': '#c4d4c4',
                'urna-btn-branco': '#ffffff',
                'urna-btn-corrige': '#f06e54',
                'urna-btn-confirma': '#47a85d',
                'urna-text': '#333333',
            },
            fontFamily: {
                'urna': ['"Open Sans"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}