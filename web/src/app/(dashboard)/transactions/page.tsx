import { Card } from "@/components/ui";

export default function Page() {
  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-ink">Transactions</h1>
      <Card className="mt-6 px-6 py-14 text-center">
        <p className="text-sm text-mute">
          The transaction ledger with pagination and filters
          lands here in the next UI commit.
        </p>
      </Card>
    </>
  );
}