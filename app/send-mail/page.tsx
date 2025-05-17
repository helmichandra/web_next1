import { Suspense } from "react";
import SendMessageClient from "./client";

export default function SendMessagePage(): React.ReactElement {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SendMessageClient />
    </Suspense>
  );
}