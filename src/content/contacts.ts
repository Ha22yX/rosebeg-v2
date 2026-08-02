import type { ContactChannel } from "@/content/types";

export const contacts = [
  { label: "GitHub", handle: "@Ha22yX", href: "https://github.com/Ha22yX", description: "Code archive" },
  { label: "WeChat", handle: "imxzy945", href: "weixin://contacts/profile/imxzy945", description: "Private signal" },
  { label: "Instagram", handle: "@ha22yx", href: "https://www.instagram.com/ha22yx/", description: "Field images" },
  { label: "Email", handle: "ha22y.xing@gmail.com", href: "mailto:ha22y.xing@gmail.com", description: "Direct channel" },
] satisfies readonly ContactChannel[];
