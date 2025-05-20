export function generateStaticParams() {
  // 返回所有可能的提示词类型
  return [
    { type: 'ai_writing' },
    { type: 'ai_polishing' },
    { type: 'ai_analysis' },
    { type: 'worldbuilding' },
    { type: 'character' },
    { type: 'plot' },
    { type: 'introduction' },
    { type: 'outline' },
    { type: 'detailed_outline' },
    { type: 'book_tool' }
  ];
}

export default function PromptTypeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
