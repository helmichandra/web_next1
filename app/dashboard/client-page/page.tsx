import { Suspense } from "react";
import ClientList from "./client-list";

export default function SendMessagePage(): React.ReactElement {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientList />
    </Suspense>
  );
}