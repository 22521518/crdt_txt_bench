import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  // css: {
  //   preprocessorOptions: {
  //     scss: {
  //       additionalData: '@use "./app/index.scss" as *;\n',
  //     },
  //   },
  // },
});
