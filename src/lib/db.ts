import PocketBase from "pocketbase";

const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
export const pb = new PocketBase(pbUrl);

// Turn off auto-cancellation for simple query batching
pb.autoCancellation(false);

