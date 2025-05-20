export function generateStaticParams() {
  // 为静态导出生成一些示例ID
  // 在实际部署时，这些ID应该从数据库中获取
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' }
  ];
}

export default function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
