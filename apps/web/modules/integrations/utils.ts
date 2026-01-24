import {
  HTML_SNIPPET,
  type IntegrationId,
  REACT_SNIPPET,
  NEXTJS_SNIPPET,
  JAVASCRIPT_SNIPPET,
} from "./constants";

export const createScript = (integrationId: string, organizationId: string) => {
  if (integrationId === "html") {
    return HTML_SNIPPET.replace(/{{ORGANIZATION_ID}}/g, organizationId);
  }
  if (integrationId === "react") {
    return REACT_SNIPPET.replace(/{{ORGANIZATION_ID}}/g, organizationId);
  }
  if (integrationId === "nextjs") {
    return NEXTJS_SNIPPET.replace(/{{ORGANIZATION_ID}}/g, organizationId);
  }
  if (integrationId === "javascript") {
    return JAVASCRIPT_SNIPPET.replace(/{{ORGANIZATION_ID}}/g, organizationId);
  }
  return "";
}