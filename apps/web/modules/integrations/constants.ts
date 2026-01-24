export const INTEGRATIONS = [
  {
    id: "html",
    title: "HTML",
    icon: "/lenguages/html5.svg",
  },
  {
    id: "react",
    title: "React",
    icon: "/lenguages/react.svg",
  },
  {
    id: "nextjs",
    title: "Next.js",
    icon: "/lenguages/nextjs.svg",
  },
  {
    id: "javascript",
    title: "JavaScript",
    icon: "/lenguages/javascript.svg",
  },
]

export type IntegrationId = (typeof INTEGRATIONS)[number]["id"];

export const HTML_SNIPPET = `<script data-organization-id="{{ORGANIZATION_ID}}"></script>`;
export const REACT_SNIPPET = `<script data-organization-id="{{ORGANIZATION_ID}}"></script>`;
export const NEXTJS_SNIPPET = `<script data-organization-id="{{ORGANIZATION_ID}}"></script>`;
export const JAVASCRIPT_SNIPPET = `<script data-organization-id="{{ORGANIZATION_ID}}"></script>`;