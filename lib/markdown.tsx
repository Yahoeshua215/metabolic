import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-4 leading-7 text-muted-foreground last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground">{children}</ul>,
        ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-5 text-muted-foreground">{children}</ol>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
