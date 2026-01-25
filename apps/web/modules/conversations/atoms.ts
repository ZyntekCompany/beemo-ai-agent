import { Doc } from "@workspace/backend/_generated/dataModel";
import { atomWithStorage } from "jotai/utils";
import { STATUS_FILTER_KEY, TYPE_FILTER_KEY } from "../conversations/constants";

export const statusFilterAtom = atomWithStorage<
  Doc<"conversations">["status"] | "all"
>(STATUS_FILTER_KEY, "all");

export const typeFilterAtom = atomWithStorage<
  Doc<"conversations">["type"] | "all"
>(TYPE_FILTER_KEY, "all");
