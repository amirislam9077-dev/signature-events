import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// /admin → admin panel, /services/<slug> → service ka page, baqi sab → website
const AdminApp = lazy(() => import("./admin/AdminApp.jsx"));
const ServicePage = lazy(() => import("./pages/ServicePage.jsx"));

const path = window.location.pathname.replace(/\/+$/, "");
const serviceSlug = path.startsWith("/services/") ? decodeURIComponent(path.slice("/services/".length)) : null;

let page = <App />;
if (path === "/admin") page = <AdminApp />;
else if (serviceSlug) page = <ServicePage slug={serviceSlug} />;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense fallback={null}>{page}</Suspense>
  </React.StrictMode>
);
