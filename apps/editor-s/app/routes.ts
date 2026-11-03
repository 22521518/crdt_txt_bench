import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // route('/', "routes/home.tsx"),
  // route('welcome', "welcome/welcome.tsx"),
  // route('/editor-s/:active_docs_url?', "routes/editor-s.tsx"),
  layout("layouts/admin-layout.tsx", [
    route("/:active_docs_url?", "routes/editor-s.tsx"),
    route("welcome", "welcome/welcome.tsx"),
    // index("routes/home.tsx"),

  ])
] satisfies RouteConfig;
