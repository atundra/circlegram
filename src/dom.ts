import { ClassAttributes, createElement as r, HTMLAttributes, ReactNode } from "react";

export const div = (a?: HTMLAttributes<"div"> & ClassAttributes<"div">) => (...c: ReactNode[]) =>
  r("div", a, ...c);
