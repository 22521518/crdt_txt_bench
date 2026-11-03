import React from 'react'
import type { Route } from "../+types/root";
import { RichTextEditor } from '@/components/richtext/richtext-editor';

export async function loader({ params }: Route.LoaderArgs) {
  const { active_docs_url } = params;
  const doc_title = active_docs_url;
  return { doc_title: doc_title ?? "Untitled Document", doc_url: active_docs_url ?? "" }
}

export function meta({ loaderData }: Route.MetaArgs) {
  const { doc_title } = loaderData ?? { doc_title: "Untitled Document" }
  return [
    { doc_title: `${doc_title } - My Editor` },
  ];
}

export default function Home({ loaderData, }: Route.ComponentProps) {
  const { doc_title, doc_url } = loaderData ?? { doc_title: "Untitled Document", doc_url: "" }
  const [docTitle, setDocTitle] = React.useState<string>(doc_title);

  console.log("Need implement function to load the doc_url, ", doc_url)
  const onTitleChange = (newTitle: string) => {
    setDocTitle(newTitle);
    // const slug = newTitle.trim().toLowerCase().replace(/\s+/g, "-");
    // window.history.replaceState( null, "", `/editor-s/${slug}` );
  }

  React.useEffect(() => {
    document.title = `${docTitle.slice(0, 10)}${docTitle.length > 10 ? '...' : ''} - My Editor`;
  }, [docTitle]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '32px'
    }}>
      <input
        value={docTitle}
        onChange={(e) => onTitleChange(e.target.value)}
      />

      <RichTextEditor />
    </div>
  );
}
