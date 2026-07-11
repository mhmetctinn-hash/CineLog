import { Fragment } from 'react';

// Minimal, safe **bold** / *italic* markdown-subset renderer — no HTML parsing,
// so there's no XSS surface. Anything not matching the two patterns is plain text.
function renderInline(text: string, keyPrefix: string) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={`${keyPrefix}-${i}`}>{token.slice(1, -1)}</em>;
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{token}</Fragment>;
  });
}

export function ReviewText({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n');
  return (
    <p className={className}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderInline(line, String(i))}
        </Fragment>
      ))}
    </p>
  );
}
