export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          IdleLearn 智学谷 · 免费开源学习平台
        </p>
        <p className="text-center text-sm text-muted-foreground md:text-right">
          代码 MIT · 内容 CC-BY-SA 4.0
        </p>
      </div>
    </footer>
  );
}
