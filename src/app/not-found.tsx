import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="subpage" id="main">
      <div className="page-heading">
        <p className="eyebrow">404 · No route found</p>
        <h1>
          That page has<br />
          <em>left the stand.</em>
        </h1>
        <p>The address you followed doesn&apos;t exist here, or it has been retired.</p>
        <Link className="text-link" href="/" style={{ marginTop: "34px" }}>
          Back to the homepage <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
